import * as z from 'zod/v4';

export const FULL_REGION = { page: 1, x: 0, y: 0, width: 1, height: 1 } as const;

export const RegionSchema = z
  .object({
    page: z.number().int().min(1),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  })
  .strict();

export const InspectImageInputSchema = z
  .object({
    assetId: z
      .string()
      .min(1)
      .max(160)
      .describe('Server-scoped local asset id, for example img_abc.png or shot_checkout.png'),
    goal: z
      .string()
      .min(1)
      .max(2_000)
      .describe('The exact visual question to answer; do not request a generic caption'),
    mode: z.enum(['auto', 'scene', 'ocr', 'document', 'chart', 'ui']).optional(),
    region: RegionSchema.optional().describe('Optional crop in normalized 0..1 coordinates'),
    resolution: z.enum(['auto', 'low', 'high']).optional(),
  })
  .strict();

export const ImportImageInputSchema = z
  .object({
    sourcePath: z
      .string()
      .min(1)
      .max(4_096)
      .describe('Absolute path to a local image file in one of the configured import roots'),
  })
  .strict();

const ConfidenceSchema = z.number().min(0).max(1);

export const FactSchema = z
  .object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
    confidence: ConfidenceSchema,
    evidenceIds: z.array(z.string()),
  })
  .strict();

export const EvidenceSchema = z
  .object({
    id: z.string(),
    claim: z.string(),
    region: RegionSchema,
    confidence: ConfidenceSchema,
  })
  .strict();

export const VisibleTextSchema = z
  .object({
    text: z.string(),
    region: RegionSchema,
    confidence: ConfidenceSchema,
  })
  .strict();

export const SecuritySchema = z
  .object({
    containsInstructionLikeText: z.boolean(),
    snippets: z.array(z.string()),
  })
  .strict();

export const VisionModelResultSchema = z
  .object({
    modality: z.enum(['photo', 'screenshot', 'document', 'chart', 'ui', 'unknown']),
    answer: z.string(),
    facts: z.array(FactSchema),
    evidence: z.array(EvidenceSchema),
    visibleText: z.array(VisibleTextSchema),
    uncertainties: z.array(z.string()),
    needsRetry: z.boolean(),
    retryHint: z.string(),
    security: SecuritySchema,
  })
  .strict();

export const VisualObservationSchema = VisionModelResultSchema.extend({
  schemaVersion: z.literal('visual-observation/v1'),
  assetId: z.string(),
  goal: z.string(),
  source: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      sentWidth: z.number().int().positive(),
      sentHeight: z.number().int().positive(),
      analyzedRegion: RegionSchema,
      model: z.string(),
    })
    .strict(),
}).strict();

const generatedJsonSchema = z.toJSONSchema(VisionModelResultSchema) as Record<string, unknown>;
delete generatedJsonSchema.$schema;
export const VISION_MODEL_JSON_SCHEMA = generatedJsonSchema;

export type Region = z.infer<typeof RegionSchema>;
export type InspectImageInput = z.infer<typeof InspectImageInputSchema>;
export type ImportImageInput = z.infer<typeof ImportImageInputSchema>;
export type VisionModelResult = z.infer<typeof VisionModelResultSchema>;
export type VisualObservation = z.infer<typeof VisualObservationSchema>;
