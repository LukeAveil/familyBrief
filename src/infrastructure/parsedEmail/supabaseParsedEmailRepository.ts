import type {
  CreateParsedEmailInput,
  ParsedEmailRecord,
  ParsedEmailRepository,
} from "@/application/parsedEmail/parsedEmailPorts";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const supabaseParsedEmailRepository: ParsedEmailRepository = {
  async create(input: CreateParsedEmailInput): Promise<ParsedEmailRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("parsed_emails")
      .insert({
        user_id: input.userId,
        from_address: input.fromAddress,
        subject: input.subject,
        body: input.body ?? null,
        processed: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      return null;
    }

    return { id: data.id };
  },
};
