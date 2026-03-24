import { recordParsedEmail } from "@/application/parsedEmail/parsedEmailUseCases";
import type {
  ParsedEmailRepository,
  CreateParsedEmailInput,
  ParsedEmailRecord,
} from "@/application/parsedEmail/parsedEmailPorts";

const mockRecord: ParsedEmailRecord = { id: "pe1" };

const input: CreateParsedEmailInput = {
  userId: "u1",
  fromAddress: "sender@example.com",
  subject: "Soccer practice",
  body: "Practice on Tuesday at 4pm",
};

function makeRepo(
  overrides: Partial<ParsedEmailRepository> = {}
): ParsedEmailRepository {
  return {
    create: jest.fn().mockResolvedValue(mockRecord),
    ...overrides,
  };
}

describe("recordParsedEmail", () => {
  it("delegates to repo.create", async () => {
    const repo = makeRepo();
    const result = await recordParsedEmail(input, repo);
    expect(repo.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockRecord);
  });

  it("returns null when repo returns null", async () => {
    const repo = makeRepo({ create: jest.fn().mockResolvedValue(null) });
    const result = await recordParsedEmail(input, repo);
    expect(result).toBeNull();
  });
});
