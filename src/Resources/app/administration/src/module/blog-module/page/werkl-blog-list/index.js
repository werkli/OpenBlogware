import template from './werkl-blog-list.html.twig';
import './werkl-blog-list.scss';
import slugify from 'slugify';

const { Mixin, Context } = Shopware;
const Criteria = Shopware.Data.Criteria;

export default {
    template,

    inject: [
        'repositoryFactory',
        'systemConfigApiService',
    ],

    mixins: [
        Mixin.getByName('salutation'),
        Mixin.getByName('listing'),
        Mixin.getByName('notification'),
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

        onEdit(blogEntry) {
            this.$router.push({ name: 'blog.module.detail', params: { id: blogEntry.id } });
        },

        async onDelete(blogEntry) {
            if (!confirm(this.$tc('werkl-blog.list.confirmDelete', 0, { title: blogEntry.title }))) {
                return;
            }

            this.isLoading = true;

            try {
                await this.blogEntryRepository.delete(blogEntry.id, Shopware.Context.api);

                this.createNotificationSuccess({
                    message: this.$tc('werkl-blog.list.notification.deleteSuccess', 0, {
                        title: blogEntry.title,
                    }),
                });

                await this.getList();
            } catch (error) {
                this.createNotificationError({
                    message: this.$tc('werkl-blog.list.notification.deleteError'),
                });
                console.error('Error deleting blog entry:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async onDuplicate(blogEntry) {
            this.isLoading = true;

            try {
                // Load the blog entry with categories and tags
                const criteria = new Criteria();
                criteria.addAssociation('blogCategories');
                criteria.addAssociation('tags');

                const fullBlogEntry = await this.blogEntryRepository.get(
                    blogEntry.id,
                    Context.api,
                    criteria
                );

                // Create a new blank CMS page for the duplicate
                // CMS content (sections/blocks) cloning requires complex entity handling
                // Use the built-in "Section duplicate" / "Block duplicate" in the CMS editor instead
                const newPage = this.pageRepository.create();
                newPage.name = `${fullBlogEntry.title} (Copy)`;
                newPage.type = 'blog_detail';
                newPage.sections = [];

                await this.pageRepository.save(newPage, Context.api);

                // Create the new blog entry
                const newBlogEntry = this.blogEntryRepository.create();

                newBlogEntry.title = `${fullBlogEntry.title} (Copy)`;
                newBlogEntry.slug = slugify(`${fullBlogEntry.title} (Copy)`, { lower: true });
                newBlogEntry.teaser = fullBlogEntry.teaser;
                newBlogEntry.metaTitle = fullBlogEntry.metaTitle;
                newBlogEntry.metaDescription = fullBlogEntry.metaDescription;
                newBlogEntry.authorId = fullBlogEntry.authorId;
                newBlogEntry.publishedAt = null;
                newBlogEntry.active = false;
                newBlogEntry.detailTeaserImage = fullBlogEntry.detailTeaserImage;
                newBlogEntry.mediaId = fullBlogEntry.mediaId;
                newBlogEntry.cmsPageId = newPage.id;

                if (fullBlogEntry.blogCategories && fullBlogEntry.blogCategories.length > 0) {
                    fullBlogEntry.blogCategories.forEach(category => {
                        newBlogEntry.blogCategories.add(category);
                    });
                }

                if (fullBlogEntry.tags && fullBlogEntry.tags.length > 0) {
                    fullBlogEntry.tags.forEach(tag => {
                        newBlogEntry.tags.add(tag);
                    });
                }

                await this.blogEntryRepository.save(newBlogEntry, Context.api);

                this.createNotificationSuccess({
                    message: this.$tc('werkl-blog.list.notification.duplicateSuccess', 0, {
                        title: fullBlogEntry.title,
                    }),
                });

                await this.getList();

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
