module.exports = (function templateCache() {
  const { $ } = Backbone;
  const { extend } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;

  const TemplateCache = function() {
    this.templates = {};
    this.initialize();
  }

  extend(TemplateCache.prototype, {
    get(templateId) {
      let cachedTemplate = this.templates[templateId];
      if (typeof cachedTemplate === 'undefined') {
        throw new Error(`Template "${templateId}" not found`);
      }
      return cachedTemplate;
    },
    put(templateId, template) {
      this.templates[templateId] = template;
    },
    initialize() {
      const templates = $('[type="text/template"]');
      $.each(templates, (i, template) => {
        template = $(template);
        this.put(template.attr('id'), template.html());
      });
    }
  });

  Tumblr.Fox.Utils.TemplateCache = new TemplateCache();
  ComponentFetcher.put('TemplateCache', TemplateCache);
})
