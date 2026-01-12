export class RSSFetchError extends Error {
  constructor(
    message: string,
    public channelId: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'RSSFetchError'
  }
}

export class RSSParseError extends Error {
  constructor(
    message: string,
    public channelId: string
  ) {
    super(message)
    this.name = 'RSSParseError'
  }
}
