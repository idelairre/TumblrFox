import Faker from 'faker';
import { first, sample } from 'lodash';

import user from './user-fixture.json'
console.log(user);

const contentRating = () => {
  return sample(['adult', 'nsfw']);
}

const flavor = tumblelog => {
  const seperators = ['-', '_', '', '-and-'];
  let modifier = sample(['girl', 'asexual', 'buddy', 'hoe', 'biddy', 'demonic', 'anarchy', 'left', 'succubus', 'soft', 'rude', 'grunge', 'slut', 'blood', 'minus', 'communist', 'loser', 'mermaid', 'fox', 'scorpio', 'queer', 'antifa', '69', 'trans', 'supa', 'slayin', 'words', 'poly']);
  if (Faker.random.boolean()) {
    if (Faker.random.boolean()) {
      return tumblelog + `${sample(seperators) + modifier}`;
    } else {
      return modifier + sample(seperators) + tumblelog;
    }
  } else {
    return tumblelog;
  }
}

export const generateTumblelogName = () => {
  return flavor(first(Faker.internet.userName().split('_')).replace(/\./, '')).toLowerCase();
}

export const generateUser = (name = generateTumblelogName()) => {
  const user = {
    title: name,
    posts: Faker.random.number(),
    updated: Date.parse(Faker.date.past()),
    description: Faker.lorem.sentence(),
    is_nsfw: Faker.random.boolean(),
    ask: Faker.random.boolean(),
    likes: Faker.random.number()
  };
  if (user.ask) {
    user.ask_anon = Faker.random.boolean();
  }
  return user;
}

export const generateTumblelogs = num => {
  const tumblelogs = [];
  for (let i = 0; i < num; i += 1) {
    tumblelogs.push(generateTumblelog());
  }
  return tumblelogs;
}
