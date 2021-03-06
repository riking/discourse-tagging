function formatTag(t) {
  const ret = "<a href class='discourse-tag'>" + Handlebars.Utils.escapeExpression(t.id) + "</a>";
  return (t.count) ? ret + " <span class='discourse-tag-count'>x" + t.count + "</span>" : ret;
}

export default Ember.TextField.extend({
  classNameBindings: [':tag-chooser'],
  attributeBindings: ['tabIndex'],

  _setupTags: function() {
    const tags = this.get('tags') || [];
    this.set('value', tags.join(", "));
  }.on('init'),

  _valueChanged: function() {
    const tags = this.get('value').split(',').map(v => v.trim()).reject(v => v.length === 0).uniq();
    this.set('tags', tags);
  }.observes('value'),

  _initializeTags: function() {
    const site = this.site,
          filterRegexp = new RegExp(this.site.tags_filter_regexp, "g");

    this.$().select2({
      tags: true,
      placeholder: I18n.t('tagging.choose_for_topic'),
      maximumInputLength: this.siteSettings.max_tag_length,
      maximumSelectionSize: this.siteSettings.max_tags_per_topic,
      initSelection(element, callback) {
        const data = [];

        function splitVal(string, separator) {
          var val, i, l;
          if (string === null || string.length < 1) return [];
          val = string.split(separator);
          for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $.trim(val[i]);
          return val;
        }

        $(splitVal(element.val(), ",")).each(function () {
          data.push({
            id: this,
            text: this
          });
        });

        callback(data);
      },
      createSearchChoice: function(term, data) {
        term = term.replace(filterRegexp, '').trim();

        // No empty terms, make sure the user has permission to create the tag
        if (!term.length || !site.get('can_create_tag')) { return; }

        if ($(data).filter(function() {
          return this.text.localeCompare(term) === 0;
        }).length === 0) {
          return { id: term, text: term };
        }
      },
      formatSelectionCssClass: function () { return "discourse-tag"; },
      formatResult: formatTag,
      // formatSelection: formatTag,
      multiple: true,
      ajax: {
        quietMillis: 200,
        cache: true,
        url: "/tags/filter/search",
        dataType: 'json',
        data: function (term) {
          return { q: term };
        },
        results: function (data) {
          return data;
        }
      },
    });
  }.on('didInsertElement'),

  _destroyTags: function() {
    this.$().select2('destroy');
  }.on('willDestroyElement')

});
