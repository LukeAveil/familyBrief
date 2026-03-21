import type { CreateParsedEmailInput } from "@/application/parsedEmail/parsedEmailPorts";
import { recordParsedEmail } from "@/application/parsedEmail/parsedEmailUseCases";
import { supabaseParsedEmailRepository } from "@/infrastructure/parsedEmail/supabaseParsedEmailRepository";

export function runRecordParsedEmail(input: CreateParsedEmailInput) {
  return recordParsedEmail(input, supabaseParsedEmailRepository);
}
