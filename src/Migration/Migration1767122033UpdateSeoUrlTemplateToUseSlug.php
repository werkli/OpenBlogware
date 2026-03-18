<?php
declare(strict_types=1);

namespace Werkl\OpenBlogware\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1767122033UpdateSeoUrlTemplateToUseSlug extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1767122033;
    }

    public function update(Connection $connection): void
    {
        // Update the SEO URL template to use slug instead of title
        // This handles both old and new template formats
        // This will cause all blog entry SEO URLs to be regenerated

        // Update the newer template format (with categories)
        $connection->executeStatement(
            <<<SQL
                    UPDATE `seo_url_template`
                    SET `template` = 'blog/{{ entry.blogCategories.first.translated.name|lower }}/{{ entry.translated.slug|lower }}'
                    WHERE `entity_name` = 'werkl_blog_entry'
                    AND `template` = 'blog/{{ entry.blogCategories.first.translated.name|lower }}/{{ entry.translated.title|lower }}'
                SQL
        );

        // Update the original template format (without categories)
        $connection->executeStatement(
            <<<SQL
                    UPDATE `seo_url_template`
                    SET `template` = 'blog/{{ entry.translated.slug|lower }}'
                    WHERE `entity_name` = 'werkl_blog_entry'
                    AND `template` = 'blog/{{ entry.translated.title|lower }}'
                SQL
        );
    }

    public function updateDestructive(Connection $connection): void
    {
        // No destructive changes needed
    }
}
