import React from 'react';
import Giscus from "@giscus/react";
import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function GiscusComponent() {
  const { colorMode } = useColorMode();

  const { siteConfig } = useDocusaurusContext();
  const { customFields, i18n } = siteConfig;
  const { giscus } = customFields;

  const {i18n: {defaultLocale, localeConfigs}} = useDocusaurusContext()

  return (
    <Giscus
        repo={giscus.repo}
        repoId={giscus.repoId}
        category={giscus.category}
        categoryId={giscus.categoryId}
        mapping={giscus.mapping}
        strict={giscus.strict}
        reactionsEnabled={giscus.reactionEnabled}
        emitMetadata={giscus.emitMetadata}
        inputPosition={giscus.inputPosition}
        theme={colorMode}
        lang={defaultLocale}
        crossorigin="anonymous"
        term="Welcome to @giscus/react component!"
        loading={giscus.loading}
        async
    />
  );
}