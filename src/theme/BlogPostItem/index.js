import React from 'react'
import BlogPostItem from '@theme-original/BlogPostItem'
import GiscusComponent from '@site/src/components/GiscusComment'
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

export default function BlogPostItemWrapper(props) {
  const {metadata, isBlogPostPage} = useBlogPost()

  const { frontMatter, slug, title } = metadata
  const { enableComments } = frontMatter

  return (
      <>
        <BlogPostItem {...props} />
        {(enableComments && isBlogPostPage) && (
          <GiscusComponent />
        )}
      </>
  );
}