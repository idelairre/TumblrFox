module.exports = (function tests(Tumblr, Backbone, $, _, jasmine) {
  const { template } = _;
  const { View } = Backbone;
  const { Events } = Tumblr.Fox;
  const { ComponentFetcher, TemplateCache } = Tumblr.Fox.Utils;

  const env = jasmine.getEnv();

  const queryString = new jasmine.QueryString({
    getWindowLocation() {
      return window.location;
    }
  });

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

  const Test = View.extend({
    template: template(TemplateCache.get('testTemplate')),
    tagName: 'li',
    className: 'post_container test',
    events: {
      'click [data-post-action="remove"]': 'dismiss'
    },
    initialize() {
      const specFilter = new jasmine.HtmlSpecFilter({
        filterString() {
          return queryString.getParam('spec');
        }
      });

      env.catchExceptions(typeof queryString.getParam('catch') === 'undefined' ? true : queryString.getParam('catch'));
      env.throwOnExpectationFailure(queryString.getParam('throwFailures'));
      env.randomizeTests(queryString.getParam('random'));
      queryString.getParam('seed') ? env.seed(seed) : null;

      env.specFilter = spec => {
        return specFilter.matches(spec.getFullName());
      };
      env.addReporter(this.htmlReporter);
      this.render();
    },
    render() {
      this.$el.html(this.template);
      this.$el.attr('data-pageable', 'post_0');
      $('.post_container').first().after(this.$el);
      Tests(Tumblr.Fox.get('BlogModel'));
      this.htmlReporter.initialize();
      env.execute();
      return this;
    },
    dismiss() {
      this.$el.fadeOut(300).promise().then(() => {
        this.remove();
      });
    },
    htmlReporter: new jasmine.HtmlReporter({
      env: env,
      onRaiseExceptionsClick() {
        queryString.navigateWithNewParam('catch', !env.catchingExceptions());
      },
      onThrowExpectationsClick() {
        queryString.navigateWithNewParam('throwFailures', !env.throwingExpectationFailures());
      },
      onRandomClick() {
        queryString.navigateWithNewParam('random', !env.randomTests());
      },
      addToExistingQueryString(key, value) {
        return queryString.fullStringWithNewParam(key, value);
      },
      getContainer() {
        return document.getElementById('testContainer');
      },
      createElement() {
        return document.createElement.apply(document, arguments);
      },
      createTextNode() {
        return document.createTextNode.apply(document, arguments);
      },
      timer: new jasmine.Timer()
    })
  });

  const Tests = ((BlogModel) => {

    const blogModel = new BlogModel();

    describe('BlogModel', () => {
      beforeEach(done => {
        setTimeout(() => {
          done();
        }, 200);
      });

      it('should exist', () => {
        expect(blogModel).not.toBeUndefined();
      });

      it('should get user\'s content ratings', done => {
        blogModel.getContentRating('banshee-hands').then(response => {
          expect(response).not.toBeUndefined();
          expect(response.content_rating).toEqual('nsfw');
          done();
        });
      });

      it('should set its blogname attribute on the "fox:changeUser" event', () => {
        const blogname = 'thethingaboutprogramming';
        Events.trigger('fox:changeUser', blogname);
        expect(blogModel.get('blogname')).toEqual(blogname);
      });

      describe('fetch()', () => {
        it('should filter posts by type', done => {
          const query = {
            term: '',
            next_offset: 0,
            limit: 10,
            post_type: 'QUOTE'
          };
          blogModel.fetch(query).then(response => {
            expect(response).toBe(response);
            response.posts.map(post => {
              expect(post.type).toEqual(query.post_type.toLowerCase());
            })
            done();
          });
        });

        it('should filter posts by role', done => {
          const query = {
            blogname: 'thethingaboutprogramming',
            term: '',
            next_offset: 0,
            limit: 10,
            post_type: 'ANY',
            post_role: 'ORIGINAL'
          };
          blogModel.fetch(query).then(response => {
            expect(response).not.toBeUndefined(response);
            expect(response.posts.length).toEqual(query.limit);
            response.posts.map(post => {
              expect(post.reblogged_from_tumblr_url).toBe(null);
            });
            done();
          });
        });

        it('should filter posts by content rating', done => {
          const query = {
            blogname: 'banshee-hands',
            term: '',
            next_offset: 0,
            limit: 10,
            post_type: 'PHOTO',
            filter_nsfw: true
          };
          blogModel.fetch(query).then(response => {
            expect(response).toBeDefined();
            const promises = response.posts.map(post => {
              const deferred = $.Deferred();
              blogModel.getContentRating(post.reblogged_from_name).then(response => {
                deferred.resolve(response);
              });
              return deferred.promise();
            });
            $.when.apply($, promises).done((...response) => {
              const responses = [].concat(...response);
              responses.forEach(user => {
                expect(user.content_rating).not.toMatch('nsfw');
              });
              done();
            });
          });
        });

        it('should filter posts by both content rating and role', done => {
          const query = {
            blogname: 'lochnessmonster',
            term: '',
            next_offset: 0,
            limit: 10,
            post_type: 'ANY',
            filter_nsfw: true,
            post_role: 'ORIGINAL'
          };
          blogModel.fetch(query).then(response => {
            expect(response).toBeDefined();
            const promises = response.posts.map(post => {
              const deferred = $.Deferred();
              const name = post.reblogged_from_name || post.reblogged_root_name;
              if (typeof name === 'undefined') {
                deferred.resolve()
              } else {
                blogModel.getContentRating(name).then(response => {
                  deferred.resolve(response);
                });
              }
              return deferred.promise();
            });
            $.when.apply($, promises).done((...response) => {
              const responses = [].concat(...response).filter(post => {
                if (post) {
                  return post;
                }
              });
              responses.forEach(user => {
                expect(user.content_rating).not.toMatch('nsfw');
                expect(post.reblogged_from_tumblr_url).toBe(null);
              });
              done();
            });
          });
        });

      });

      describe('search()', () => {
        it('should filter posts by role', done => {
          const query = {
            blogname: 'lochnessmonster',
            term: 'gf',
            next_offset: 0,
            limit: 10,
            post_type: 'ANY',
            post_role: 'ORIGINAL'
          };
          blogModel.fetch(query).then(response => {
            expect(response).toBeDefined();
            response.map(post => {
              expect(post.reblogged_from_tumblr_url).toBe(null);
            });
            done();
          });
        });

        it('should filter posts by content rating', done => {
          const query = {
            blogname: 'lonerboner',
            term: 'me',
            next_offset: 0,
            limit: 10,
            post_type: 'PHOTO',
            filter_nsfw: true
          };
          blogModel.search(query).then(response => {
            expect(response).toBeDefined();
            const promises = response.map(post => {
              const deferred = $.Deferred();
              blogModel.getContentRating(post.reblogged_from_name).then(response => {
                deferred.resolve(response);
              });
              return deferred.promise();
            });
            $.when.apply($, promises).done((...response) => {
              const responses = [].concat(...response);
              responses.forEach(user => {
                expect(user.content_rating).not.toMatch('nsfw');
              });
              done();
            });
          });
        });
      });
    });
  });

  Tumblr.Fox.register('TestComponent', Test);

});
