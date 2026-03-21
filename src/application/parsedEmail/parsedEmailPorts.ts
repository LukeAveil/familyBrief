export type CreateParsedEmailInput = {
  userId: string;
  fromAddress: string;
  subject: string;
  body: string | null | undefined;
};

export type ParsedEmailRecord = {
  id: string;
};

export type ParsedEmailRepository = {
  create(input: CreateParsedEmailInput): Promise<ParsedEmailRecord | null>;
};
