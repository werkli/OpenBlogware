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
     * Test that "news" prefix works correctly
     */
    public function testGetConfigWithNewsPrefix(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')
            ->with('WerklOpenBlogware.config.blogUrlPrefix')
            ->willReturn('news');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();
        $template = $config->getTemplate();

        static::assertStringStartsWith('news/', $template);
    }

    /**
     * Test that "articles" prefix works correctly
     */
    public function testGetConfigWithArticlesPrefix(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')
            ->with('WerklOpenBlogware.config.blogUrlPrefix')
            ->willReturn('articles');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();
        $template = $config->getTemplate();

        static::assertStringStartsWith('articles/', $template);
    }

    /**
     * Test that "my-custom-blog" prefix with hyphens works correctly
     */
    public function testGetConfigWithHyphenatedPrefix(): void
    {
        $systemConfigService = $this->createMock(SystemConfigService::class);
        $systemConfigService->method('getString')
            ->with('WerklOpenBlogware.config.blogUrlPrefix')
            ->willReturn('my-custom-blog');

        $blogEntryDefinition = $this->createMock(BlogEntryDefinition::class);
        $route = new BlogSeoUrlRoute($blogEntryDefinition, $systemConfigService);

        $config = $route->getConfig();
        $template = $config->getTemplate();

        static::assertStringStartsWith('my-custom-blog/', $template);
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
