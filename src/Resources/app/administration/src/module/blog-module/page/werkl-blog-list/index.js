import template from './werkl-blog-list.html.twig';
import './werkl-blog-list.scss';

const { Mixin, Context } = Shopware;
const Criteria = Shopware.Data.Criteria;
const { cloneDeep } = Shopware.Utils.object;

export default {
    template,

    inject: ['repositoryFactory'],

    mixins: [
        Mixin.getByName('salutation'),
        Mixin.getByName('listing'),
    ],

    data() {
        return {
            categoryId: null,
            blogEntries: null,
            total: 0,
            isLoading: true,
            currentLanguageId: Shopware.Context.api.languageId,
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },

    created() {
        this.getList();
    },

    computed: {
        blogEntryRepository() {
            return this.repositoryFactory.create('werkl_blog_entry');
        },

        blogCategoryRepository() {
            return this.repositoryFactory.create('werkl_blog_category');
        },

        pageRepository() {
            return this.repositoryFactory.create('cms_page');
        },

        dateFilter() {
            return Shopware.Filter.getByName('date');
        },

        columns() {
            return [
                {
                    property: 'title',
                    dataIndex: 'title',
                    label: this.$tc('werkl-blog.list.table.title'),
                    routerLink: 'blog.module.detail',
                    primary: true,
                    inlineEdit: 'string',
                },
                {
                    property: 'author',
                    label: this.$tc('werkl-blog.list.table.author'),
                    inlineEdit: false,
                },
                {
                    property: 'publishedAt',
                    label: this.$tc('werkl-blog.list.table.publishedAt'),
                    inlineEdit: false,
                },
                {
                    property: 'active',
                    label: this.$tc('werkl-blog.list.table.active'),
                    inlineEdit: 'boolean',
                },
            ];
        },
    },

    methods: {
        changeLanguage(newLanguageId) {
            this.currentLanguageId = newLanguageId;
            this.getList();
        },

        changeCategoryId(categoryId) {
            if (categoryId && categoryId !== this.categoryId) {
                this.categoryId = categoryId;
                this.getList();
            }
        },

        getList() {
            this.isLoading = true;
            const criteria = new Criteria(this.page, this.limit);
            criteria.addAssociation('blogAuthor');
            criteria.addAssociation('blogCategories');
            criteria.addAssociation('tags');

            criteria.addSorting(Criteria.sort('publishedAt', 'DESC', false));

            if (this.categoryId) {
                criteria.addFilter(Criteria.equals('blogCategories.id', this.categoryId));
            }
            return this.blogEntryRepository.search(criteria, Shopware.Context.api).then((result) => {
                this.total = result.total;
                this.blogEntries = result;
                this.isLoading = false;
            });
        },

        openSponsorPage() {
            window.open('https://github.com/sponsors/7underlines', '_blank');
        },

        async onDuplicate(blogEntry) {
            this.isLoading = true;

            try {
                // Create criteria to load the full blog entry with all associations
                const criteria = new Criteria(1, 1);
                const sortCriteria = Criteria.sort('position', 'ASC', true);

                criteria
                    .addAssociation('blogCategories')
                    .addAssociation('tags')
                    .addAssociation('blogAuthor')
                    .getAssociation('cmsPage')
                    .getAssociation('sections')
                    .addSorting(sortCriteria)
                    .addAssociation('backgroundMedia')
                    .getAssociation('blocks')
                    .addSorting(sortCriteria)
                    .addAssociation('backgroundMedia')
                    .addAssociation('slots');

                // Load the full blog entry
                const fullBlogEntry = await this.blogEntryRepository.get(
                    blogEntry.id,
                    Context.api,
                    criteria
                );

                // Create a new CMS page (deep copy of the original)
                let newCmsPage = null;
                if (fullBlogEntry.cmsPage) {
                    newCmsPage = this.pageRepository.create();
                    const originalPage = fullBlogEntry.cmsPage;

                    // Copy basic page properties
                    newCmsPage.name = `${originalPage.name} (Copy)`;
                    newCmsPage.type = originalPage.type;
                    newCmsPage.locked = originalPage.locked;
                    newCmsPage.config = cloneDeep(originalPage.config);

                    // Deep copy sections - use cloneDeep and then assign new IDs
                    if (originalPage.sections && originalPage.sections.length > 0) {
                        const clonedSections = cloneDeep(originalPage.sections);
                        newCmsPage.sections = clonedSections.map(section => {
                            // Remove the ID so Shopware creates a new one
                            delete section.id;
                            delete section.cmsPageId;
                            delete section.versionId;
                            
                            if (section.blocks) {
                                section.blocks = section.blocks.map(block => {
                                    delete block.id;
                                    delete block.sectionId;
                                    delete block.versionId;
                                    
                                    if (block.slots) {
                                        block.slots = block.slots.map(slot => {
                                            delete slot.id;
                                            delete slot.blockId;
                                            delete slot.versionId;
                                            return slot;
                                        });
                                    }
                                    
                                    return block;
                                });
                            }
                            
                            return section;
                        });
                    }

                    // Save the new CMS page first
                    await this.pageRepository.save(newCmsPage, Context.api);
                }

                // Create the new blog entry
                const newBlogEntry = this.blogEntryRepository.create();

                // Copy properties from original blog entry
                newBlogEntry.title = `${fullBlogEntry.title} (Copy)`;
                newBlogEntry.slug = null; // Will be auto-generated from title
                newBlogEntry.teaser = fullBlogEntry.teaser;
                newBlogEntry.metaTitle = fullBlogEntry.metaTitle;
                newBlogEntry.metaDescription = fullBlogEntry.metaDescription;
                newBlogEntry.authorId = fullBlogEntry.authorId;
                newBlogEntry.publishedAt = null; // Set to null for inactive entry
                newBlogEntry.active = false; // Set as inactive by default
                newBlogEntry.detailTeaserImage = fullBlogEntry.detailTeaserImage;
                newBlogEntry.mediaId = fullBlogEntry.mediaId;
                newBlogEntry.cmsPageId = newCmsPage ? newCmsPage.id : null;

                // Copy categories
                if (fullBlogEntry.blogCategories && fullBlogEntry.blogCategories.length > 0) {
                    fullBlogEntry.blogCategories.forEach(category => {
                        newBlogEntry.blogCategories.add(category);
                    });
                }

                // Copy tags
                if (fullBlogEntry.tags && fullBlogEntry.tags.length > 0) {
                    fullBlogEntry.tags.forEach(tag => {
                        newBlogEntry.tags.add(tag);
                    });
                }

                // Save the new blog entry
                await this.blogEntryRepository.save(newBlogEntry, Context.api);

                // Show success notification
                this.createNotificationSuccess({
                    message: this.$tc('werkl-blog.list.notification.duplicateSuccess', 0, {
                        title: fullBlogEntry.title,
                    }),
                });

                // Refresh the list
                await this.getList();

                // Navigate to the duplicated entry
                this.$router.push({
                    name: 'blog.module.detail',
                    params: { id: newBlogEntry.id },
                });

            } catch (error) {
                this.createNotificationError({
                    message: this.$tc('werkl-blog.list.notification.duplicateError'),
                });
                console.error('Error duplicating blog entry:', error);
            } finally {
                this.isLoading = false;
            }
        },
    },
};
