// Rating scale from 0-5 based on "Comprehensive Content Based Rating Scale"
export const RATING_SCALE = {
  0: {
    name: "All Ages",
    description: "No profanity, no nudity, no violence",
    criteria: {
      profanity: "None",
      nudity: "None",
      violence: "None",
      sexualContent: "None"
    }
  },
  1: {
    name: "Juvenile Advisory",
    description: "Mild references, no explicit acts",
    criteria: {
      profanity: "Minimal mild language",
      nudity: "None",
      violence: "Cartoon/fantasy violence only",
      sexualContent: "Mild romantic references"
    }
  },
  2: {
    name: "Youth Advisory",
    description: "Moderate violence, explicit ideologies",
    criteria: {
      profanity: "Moderate language, some strong words",
      nudity: "Implied/artistic only",
      violence: "Moderate realistic violence",
      sexualContent: "Romantic situations, non-explicit"
    }
  },
  3: {
    name: "Youth Restricted",
    description: "Explicit references, moderate nudity",
    criteria: {
      profanity: "Frequent strong language",
      nudity: "Partial nudity, non-sexual context",
      violence: "Intense violence, some gore",
      sexualContent: "Sexual references and situations"
    }
  },
  4: {
    name: "Adults Only",
    description: "Graphic acts, strong profanity, gore",
    criteria: {
      profanity: "Pervasive strong language",
      nudity: "Full nudity in sexual context",
      violence: "Graphic violence and gore",
      sexualContent: "Explicit sexual content"
    }
  },
  5: {
    name: "Deviant Content",
    description: "Aberrant, sexual assault, extreme violence",
    criteria: {
      profanity: "Extreme offensive language",
      nudity: "Explicit sexual imagery",
      violence: "Extreme/sadistic violence",
      sexualContent: "Sexual violence, aberrant content, minors"
    }
  }
} as const;

// Chunking configuration
export const CHUNKING_CONFIG = {
  MAX_TOKENS: 10000,
  OVERLAP_TOKENS: 1000,
  CHARS_PER_TOKEN: 4 // Approximate for estimation
};

// Model configurations
export const MODELS = {
  OPENAI_MODERATION: "omni-moderation-latest",
  CLAUDE_RUBRIC: "claude-3-5-sonnet-20241022"
};

// Processing limits
export const PROCESSING_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PAGES: 1000,
  ANALYSIS_TIMEOUT: 10 * 60 * 1000 // 10 minutes
};

// Export formats
export const EXPORT_FORMATS = {
  PDF: "pdf",
  DOCX: "docx",
  CSV: "csv",
  JSON: "json"
} as const;
