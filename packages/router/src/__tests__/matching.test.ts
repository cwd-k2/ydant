import { describe, it, expect } from 'vitest';
import {
  extractParamNames,
  patternToRegex,
  parseQuery,
  matchPath,
} from '../matching';

describe('extractParamNames', () => {
  it('extracts parameter names from path pattern', () => {
    expect(extractParamNames('/users/:id')).toEqual(['id']);
    expect(extractParamNames('/users/:userId/posts/:postId')).toEqual([
      'userId',
      'postId',
    ]);
  });

  it('returns empty array for static paths', () => {
    expect(extractParamNames('/')).toEqual([]);
    expect(extractParamNames('/users')).toEqual([]);
    expect(extractParamNames('/users/list')).toEqual([]);
  });

  it('handles multiple parameters', () => {
    expect(extractParamNames('/:a/:b/:c')).toEqual(['a', 'b', 'c']);
  });
});

describe('patternToRegex', () => {
  it('converts static path to exact match regex', () => {
    const regex = patternToRegex('/users');
    expect(regex.test('/users')).toBe(true);
    expect(regex.test('/users/')).toBe(false);
    expect(regex.test('/user')).toBe(false);
  });

  it('converts path with parameter to capturing regex', () => {
    const regex = patternToRegex('/users/:id');
    expect(regex.test('/users/123')).toBe(true);
    expect(regex.test('/users/abc')).toBe(true);
    expect(regex.test('/users')).toBe(false);
    expect(regex.test('/users/')).toBe(false);
  });

  it('handles wildcard "*" pattern', () => {
    const regex = patternToRegex('*');
    expect(regex.test('/')).toBe(true);
    expect(regex.test('/anything')).toBe(true);
    expect(regex.test('/anything/else')).toBe(true);
  });

  it('handles multiple parameters', () => {
    const regex = patternToRegex('/users/:userId/posts/:postId');
    expect(regex.test('/users/1/posts/2')).toBe(true);
    expect(regex.test('/users/abc/posts/xyz')).toBe(true);
    expect(regex.test('/users/1/posts')).toBe(false);
  });

  it('escapes special regex characters', () => {
    const regex = patternToRegex('/path.with.dots');
    expect(regex.test('/path.with.dots')).toBe(true);
    expect(regex.test('/pathXwithXdots')).toBe(false);
  });
});

describe('parseQuery', () => {
  it('parses query string into object', () => {
    expect(parseQuery('?foo=bar&baz=qux')).toEqual({
      foo: 'bar',
      baz: 'qux',
    });
  });

  it('handles query string without leading ?', () => {
    expect(parseQuery('foo=bar')).toEqual({ foo: 'bar' });
  });

  it('handles empty query string', () => {
    expect(parseQuery('')).toEqual({});
    expect(parseQuery('?')).toEqual({});
  });

  it('handles values without equals sign', () => {
    expect(parseQuery('?foo')).toEqual({ foo: '' });
  });

  it('decodes URL-encoded characters', () => {
    expect(parseQuery('?name=John%20Doe')).toEqual({ name: 'John Doe' });
    expect(parseQuery('?path=%2Fhome%2Fuser')).toEqual({ path: '/home/user' });
  });

  it('handles multiple values for same key (last wins)', () => {
    expect(parseQuery('?foo=first&foo=second')).toEqual({ foo: 'second' });
  });
});

describe('matchPath', () => {
  it('matches static paths exactly', () => {
    const result = matchPath('/users', '/users');
    expect(result.match).toBe(true);
    expect(result.params).toEqual({});
  });

  it('returns no match for different paths', () => {
    const result = matchPath('/posts', '/users');
    expect(result.match).toBe(false);
    expect(result.params).toEqual({});
  });

  it('extracts parameters from path', () => {
    const result = matchPath('/users/123', '/users/:id');
    expect(result.match).toBe(true);
    expect(result.params).toEqual({ id: '123' });
  });

  it('extracts multiple parameters', () => {
    const result = matchPath('/users/42/posts/7', '/users/:userId/posts/:postId');
    expect(result.match).toBe(true);
    expect(result.params).toEqual({ userId: '42', postId: '7' });
  });

  it('matches wildcard to any path', () => {
    const result = matchPath('/any/path/here', '*');
    expect(result.match).toBe(true);
    expect(result.params).toEqual({});
  });

  it('matches root path', () => {
    const result = matchPath('/', '/');
    expect(result.match).toBe(true);
    expect(result.params).toEqual({});
  });
});
