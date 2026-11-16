// OAuth callbacks belong to Expo's pending auth session, never the screen router.
export function isNavigationLink(url: string): boolean {
  return !/^eatinformed:\/\/auth\/callback(?:[/?#]|$)/i.test(url);
}
