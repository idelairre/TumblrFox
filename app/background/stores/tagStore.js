import { countBy, identity } from 'lodash';
import constants from '../constants';
import db from '../lib/db';

// NOTE: this is a bit of a mess, it only manages the tags of liked posts

export default class Tags {
  static async add(tags) {
    const promises = tags.map(Tags._putAndIncrementTags);
    return Promise.all(promises);
  }

  static async fetchLikedTags() {
    return await db.tags.orderBy('count').reverse().limit(250).toArray();
  }

  static async fetchTagsByUser(blogname) { // when do you actually want to call this?
    const posts = await db.posts.where('blog_name').anyOfIgnoreCase(blogname).toArray();
    const tags = [];
    const tagCounts = countBy(tags, identity);

    for (let key in tagCounts) {
      const tag = {
        tag: key,
        count: tagCounts[key]
      };
      tags.push(tag);
    }
    return tags;
  }

  static async rehashTags() {
  }

  static async _updateTags(post) {
    if (typeof post.tags === 'string') {
      post.tags = JSON.parse(post.tags) || [];
    } else if (typeof post.tags === 'undefined') {
      post.tags = [];
    }
    if (post.tags.length > 0) {
      await Tags.add(post.tags);
    }
    return post.tags;
  }

  static async _putAndIncrementTags(tagName) {
    try { // fetching the tag first to see if it exists doesn't reliably work for some reason, hence this try/catch closure
      const tagSlug = {
        tag: tagName,
        count: 1
      };
      await db.tags.add(tagSlug);
    } catch (err) {
      const tag = await db.tags.get(tagName);
      tag.count += 1;
      await db.tags.put(tag);
    } finally {
      const count = await db.tags.toCollection().count();
      if (constants.get('cachedTagsCount') !== count) {
        constants.set('cachedTagsCount', count);
      }
    }
  }
}
