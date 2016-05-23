import { Deferred } from 'jquery';
import { isNumber, words, keyBy, union } from 'lodash';
import constants from '../constants';
import db from './db';
import { htmlAttributes, htmlTags, stemmer, stopwords } from './stemmer';
import 'babel-polyfill';

const stopStems = union(stopwords, htmlAttributes, htmlTags).map(stemmer);

export default class BM25 {
  averageDocumentLength = 0;
  totalDocuments = 0;
  totalDocumentTermLength = 0;
  k1 = 1.3;
  b = 0.75;

  constructor() {
    this.posts = {};
    this.terms = {};
    this.initialized = !1;
    this.initialize().then(() => {
      // this._parsePosts(posts).then(() => {
        // this._updateIdf().then(() => {
          console.log('[BM25]', this);
          console.log('[CONSTANTS]', constants);
          this.initialized = !0;
          this.trigger('ready');
        // });
      // });
    });
  }

  addListener(e, fct) {
    this._events = this._events || {};
    this._events[e] = this._events[e] || [];
    this._events[e].push(fct);
  }

  removeListener(e, fct) {
    this._events = this._events || {};
    if (e in this._events === false) {
      return;
    }
    this._events[e].splice(this._events[e].indexOf(fct), 1);
  }

  trigger(e /* , args... */) {
    this._events = this._events || {};
    if (e in this._events === false) {
      return;
    }
    for (let i = 0; i < this._events[e].length; i += 1) {
      this._events[e][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }

  initialize() {
    const deferred = Deferred();
    db.posts.toCollection().toArray().then(posts => {
      db.posts.toCollection().count().then(totalDocuments => {
        db.terms.toCollection().toArray().then(terms => {
          db.terms.toCollection().count().then(totalTerms => {
            this.posts = keyBy(posts, 'id');
            this.totalDocuments = totalDocuments;
            this.totalDocumentTermLength = totalTerms;
            this.averageDocumentLength = this.totalDocumentTermLength / this.totalDocuments;
            this.terms = keyBy(terms, 'term');
            // this._updateIdf(() => {
              deferred.resolve();
            // });
          });
        });
      });
    });
    return deferred.promise();
  }

  static tokenize(text) {
    const out = [];
    if (!text || text.length === 0) {
      return out;
    }
    let parsedText = words(text).map(word => {
      return word.toLowerCase();
    });
    parsedText = parsedText.map(stemmer);
    // Filter out stopStems
    for (let i = 0; parsedText.length > i; i += 1) {
      if (stopStems.indexOf(parsedText[i]) === -1 && !parsedText[i].match(/[0-9]/g)) {
        out.push(parsedText[i]);
      }
    }
    return out;
  }

  static async _parseTokens(post) {
    const _terms = {};
    const tokens = post.keys;
    tokens.map(term => {
      if (!_terms[term]) {
        _terms[term] = {
          count: 0,
          freq: 0,
          term
        };
        _terms[term].count += 1;
      }
    });
    post.terms = _terms;
    await db.posts.put(post);
  }

  async _calculateFreq(post) {
    const _terms = post.terms;
    const keys = post.keys;
    const promises = keys.map(async term => {
      _terms[term].freq = _terms[term].count / post.termCount;
      if (!this.terms[term]) {
        this.terms[term] = {
          n: 0,
          idf: 0,
          term
        };
      }
      this.terms[term].n += 1;
      db.terms.put(this.terms[term]);
    });
    await Promise.all(promises);
    post.terms = _terms;
    await db.posts.put(post);
  }

  async _parsePosts(posts) {
    console.log('[PARSING POSTS]', posts.length);
    const deferred = Deferred();
    try {
      const promises = posts.map(::this.addDocument);
      await Promise.all(promises);
      deferred.resolve();
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }

  async addDocument(post) {
    if (!post.keys.length || post.keys.length === 0) {
      return;
    }
    try {
      post.termCount = post.keys.length;
      this.totalDocuments = constants.get('cachedPostsCount') + 1;
      this.totalDocumentTermLength += post.termCount;
      this.averageDocumentLength = this.totalDocumentTermLength / this.totalDocuments;
      BM25._parseTokens(post);
      await this._calculateFreq(post);
      this.posts[post.id] = post;
      // console.log('[POST]', this.posts[post.id]);
    } catch (e) {
      console.error(e);
    }
  }

  async _updateIdf() {
    try {
      const keys = await db.terms.toCollection().keys();
      const promises = keys.map(async term => {
        const num = (this.totalDocuments - this.terms[term].n + 0.5);
        const denom = (this.terms[term].n + 0.5);
        this.terms[term].idf = Math.max(Math.log10(num / denom), 0.01);
        // console.log(this.terms[term]);
        await db.terms.put(this.terms[term]);
      });
      return Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }

  search(query) {
    const deferred = Deferred();
    try {
      const queryTerms = BM25.tokenize(query);
      const results = [];
      const keys = Object.keys(this.posts);
      for (let j = 0; keys.length > j; j += 1) {
        const id = keys[j];
        this.posts[id]._score = 0;
        if (typeof this.posts[id] === 'undefined') {
          continue;
        }
        for (let i = 0; i < queryTerms.length; i += 1) {
          const queryTerm = queryTerms[i];
          if (typeof this.terms[queryTerm] === 'undefined') {  // Means we can skip the whole term, it adds nothing to the score and isn't in any document.
            continue;
          }
          if (typeof this.posts[id].terms === 'undefined') {
            continue;
          }
          if (typeof this.posts[id].terms[queryTerm] === 'undefined') { // This term isn't in the document, so the TF portion is 0 and this term contributes nothing to the search score
            continue;
          }
          const idf = this.terms[queryTerm].idf;
          const num = this.posts[id].terms[queryTerm].count * (this.k1 + 1); // numerator of the TF portion
          // denominator of the TF portion
          const denom = this.posts[id].terms[queryTerm].count + (this.k1 * (1 - this.b + (this.b * this.posts[id].termCount / this.averageDocumentLength)));
          this.posts[id]._score += idf * num / denom; // add this query term to the sctore
        }
        if (isNumber(this.posts[id]._score) && this.posts[id]._score > 0) {
          results.push(this.posts[id]);
        }
      }
      results.sort((a, b) => {
        return b._score - a._score;
      });
      deferred.resolve(results);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }
}
