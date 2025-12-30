<?php
declare(strict_types=1);

namespace OpenBlogware\Tests\Content\Blog;

use PHPUnit\Framework\TestCase;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Werkl\OpenBlogware\Content\Blog\BlogEntryDefinition;
use Werkl\OpenBlogware\Content\Blog\BlogSeoUrlRoute;

class BlogSeoUrlRouteTest extends TestCase
{
    /**
     * Test that the default template uses "blog" prefix when no config is set
     */
    public function testGetConfigWithDefaultPrefix(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')
            ->with('WerklOpenBlogware.config.blogUrlPrefix')
            ->willReturn('');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();
        $template = $config->getTemplate();

        static::assertStringStartsWith('blog/', $template);
        static::assertStringContainsString('{{ entry.blogCategories.first.translated.name|lower }}', $template);
        static::assertStringContainsString('{{ entry.translated.slug|lower }}', $template);
    }

    /**
     * Test that custom prefix is used when configured
     */
    public function testGetConfigWithCustomPrefix(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')
            ->with('WerklOpenBlogware.config.blogUrlPrefix')
            ->willReturn('beauty-blog');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();
        $template = $config->getTemplate();

        static::assertStringStartsWith('beauty-blog/', $template);
        static::assertStringContainsString('{{ entry.blogCategories.first.translated.name|lower }}', $template);
        static::assertStringContainsString('{{ entry.translated.slug|lower }}', $template);
    }

    /**
     * Test that various custom prefixes work correctly
     */
    public function testGetConfigWithVariousPrefixes(): void
    {
        $testPrefixes = [
            'news',
            'articles',
            'my-custom-blog',
            'tech',
            'lifestyle',
        ];

        foreach ($testPrefixes as $prefix) {
            $systemConfigService = $this->createMock(SystemConfigService::class);
            $systemConfigService->method('getString')
                ->with('WerklOpenBlogware.config.blogUrlPrefix')
                ->willReturn($prefix);

            $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
            $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

            $config = $route->getConfig();
            $template = $config->getTemplate();

            static::assertStringStartsWith($prefix . '/', $template, "Prefix '$prefix' should be used in template");
        }
    }

    /**
     * Test that route name remains constant
     */
    public function testRouteNameIsConstant(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')->willReturn('test-prefix');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();

        static::assertSame(BlogSeoUrlRoute::ROUTE_NAME, $config->getRouteName());
        static::assertSame('werkl.frontend.blog.detail', $config->getRouteName());
    }
}
