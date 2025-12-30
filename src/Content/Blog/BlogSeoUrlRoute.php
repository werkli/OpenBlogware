<?php
declare(strict_types=1);

namespace Werkl\OpenBlogware\Content\Blog;

use Shopware\Core\Content\Seo\SeoUrlRoute\SeoUrlMapping;
use Shopware\Core\Content\Seo\SeoUrlRoute\SeoUrlRouteConfig;
use Shopware\Core\Content\Seo\SeoUrlRoute\SeoUrlRouteInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;

class BlogSeoUrlRoute implements SeoUrlRouteInterface
{
    public const ROUTE_NAME = 'werkl.frontend.blog.detail';
    public const DEFAULT_TEMPLATE = 'blog/{{ entry.blogCategories.first.translated.name|lower }}/{{ entry.translated.slug|lower }}';

    public function __construct(
        private readonly BlogEntryDefinition $blogEntryDefinition,
        private readonly SystemConfigService $systemConfigService
    ) {
    }

    public function getConfig(): SeoUrlRouteConfig
    {
        $template = $this->getTemplate();

        return new SeoUrlRouteConfig(
            $this->blogEntryDefinition,
            self::ROUTE_NAME,
            $template,
            true
        );
    }

    private function getTemplate(): string
    {
        $prefix = $this->systemConfigService->getString('WerklOpenBlogware.config.blogUrlPrefix');
        if ($prefix === null || $prefix === '') {
            $prefix = 'blog';
        }

        // Use the configured prefix instead of hardcoded "blog"
        return $prefix . '/{{ entry.blogCategories.first.translated.name|lower }}/{{ entry.translated.slug|lower }}';
    }

    public function prepareCriteria(Criteria $criteria, SalesChannelEntity $salesChannel): void
    {
        $criteria->addAssociations([
            'blogCategories',
            'blogAuthor',
            'tags',
        ]);
    }

    public function getMapping(Entity $entry, ?SalesChannelEntity $salesChannel): SeoUrlMapping
    {
        if (!$entry instanceof BlogEntryEntity) {
            throw new \InvalidArgumentException('Expected BlogEntryEntity');
        }

        return new SeoUrlMapping(
            $entry,
            ['articleId' => $entry->getId()],
            [
                'entry' => $entry,
            ]
        );
    }
}
