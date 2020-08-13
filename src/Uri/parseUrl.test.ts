import { Path } from '@typed/fp/Path'
import { describe, given, it, Test } from '@typed/test'
import { ParsedUri, parseUri, Uri } from '.'

export const test: Test = describe(`parseUrl`, [
  given(`an href`, [
    it(`parses it`, ({ equal }) => {
      const href = Uri.wrap(
        `https://video.google.co.uk:80/videoplay?docid=-72496927612831078230&hl=en#00h02m30s`,
      )

      const expected: ParsedUri = {
        href: 'https://video.google.co.uk:80/videoplay?docid=-72496927612831078230&hl=en#00h02m30s',
        protocol: 'https:',
        host: 'video.google.co.uk:80',
        userInfo: '',
        username: '',
        password: '',
        hostname: 'video.google.co.uk',
        port: '80',
        relative: '/videoplay?docid=-72496927612831078230&hl=en#00h02m30s',
        pathname: Path.wrap('/videoplay'),
        directory: '/',
        file: 'videoplay',
        search: '?docid=-72496927612831078230&hl=en',
        hash: '#00h02m30s',
      }

      equal(expected, parseUri(href))
    }),
  ]),
])
