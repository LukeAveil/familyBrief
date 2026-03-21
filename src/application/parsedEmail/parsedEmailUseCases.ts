import type {
  CreateParsedEmailInput,
  ParsedEmailRecord,
  ParsedEmailRepository,
} from "@/application/parsedEmail/parsedEmailPorts";

export async function recordParsedEmail(
  input: CreateParsedEmailInput,
  repo: ParsedEmailRepository
): Promise<ParsedEmailRecord | null> {
  return repo.create(input);
}
