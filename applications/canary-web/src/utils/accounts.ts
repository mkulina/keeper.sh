interface AccountLike {
  displayName: string | null;
  email: string | null;
  provider: string;
}

export function getAccountLabel(account: AccountLike): string {
  if (account.displayName) return account.displayName;
  if (account.email) return account.email;
  return account.provider;
}
