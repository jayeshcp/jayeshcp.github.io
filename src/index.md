---
layout: layouts/layout.njk
---

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
