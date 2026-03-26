---
layout: layouts/layout.njk
---

## Presentation Slides

- [Web Accessibility Guidelines](./slides/web%20accessibility%20guidelines/index.html)
- [Scalable System Design](./slides/scalable%20system%20design/index.html)

## All posts

> Some of the interesting topics related to software design & development.

<ul class="posts">
{%- for post in collections.post -%}
  <li>
    <a href="{{ post.url }}">{{ post.data.title }}</a>{% if post.data.category %}
      <span>[{{ post.data.category }}]</span>
    {% endif %}
  </li>
{%- endfor -%}
</ul>
