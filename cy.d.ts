export interface Demonstration {
  id: string;
  type: DemonstrationType;
  title: string;
  task: Task | null;
  createdAt: Date;
  updatedAt: Date;
  content: DemonstrationContent;
  privacy: DemonstrationPrivacy;
  review: DemonstrationReviewState;
  collabAbility: DemonstrationCollaboratorAbility;
  frozen: DemonstrationFreezeState;
  author: ProjectMember | null;
  participants: Array<ProjectMember>;
}

export interface Project {
  id: string;
  displayName: string;
  iconRid: string | null;
  privacy: ProjectPrivacy;
  config: ProjectConfig;
  privilege?: MemberRole | null;
}

export interface ProjectMember {
  privilege: MemberRole | null;
}

export interface Task {
  id: string;
  name: string;
  emoticon: string | null;
  color: string | null;
  description: string;
  index: number;
  enabled: boolean;
  type: TaskType;
  config: TaskConfig;
  options: TaskOptions;
}

export interface User {
  id: string;
  createdAt: Date;
  display: string | null;
  username: string;
  avatarRid: string | null;
  sitewideRole: UserSitewideRole;
}

export const DemonstrationType: {
  DEMONSTRATION: "DEMONSTRATION";
  EXPERIMENT: "EXPERIMENT";
};

export type DemonstrationType = (typeof DemonstrationType)[keyof typeof DemonstrationType];

export const DemonstrationReviewState: {
  UNREVIEWED: "UNREVIEWED";
  MEETS_CRITERIA: "MEETS_CRITERIA";
  DISAPPROVED: "DISAPPROVED";
  APPROVED: "APPROVED";
};

export type DemonstrationReviewState = (typeof DemonstrationReviewState)[keyof typeof DemonstrationReviewState];

export const DemonstrationCollaboratorAbility: {
  NONE: "NONE";
  ACCEPTS_FEEDBACK: "ACCEPTS_FEEDBACK";
  ACCEPTS_COLLABORATORS: "ACCEPTS_COLLABORATORS";
};

export type DemonstrationCollaboratorAbility = (typeof DemonstrationCollaboratorAbility)[keyof typeof DemonstrationCollaboratorAbility];

export const DemonstrationFreezeState: {
  UNFROZEN: "UNFROZEN";
  FROZEN_BY_MOD: "FROZEN_BY_MOD";
  FROZEN_BY_AUTHOR: "FROZEN_BY_AUTHOR";
};

export type DemonstrationFreezeState = (typeof DemonstrationFreezeState)[keyof typeof DemonstrationFreezeState];

export const DemonstrationPrivacy: {
  PRIVATE: "PRIVATE";
  UNLISTED: "UNLISTED";
  PUBLIC: "PUBLIC";
  ADULATION: "ADULATION";
};

export type DemonstrationPrivacy = (typeof DemonstrationPrivacy)[keyof typeof DemonstrationPrivacy];

export const ProjectPrivacy: {
  OPEN: "OPEN";
  INVITE_ONLY: "INVITE_ONLY";
  PRIVATE: "PRIVATE";
};

export type ProjectPrivacy = (typeof ProjectPrivacy)[keyof typeof ProjectPrivacy];

export const MemberRole: {
  BANNED: "BANNED";
  GENERAL: "GENERAL";
  MODERATOR: "MODERATOR";
  ADMINISTRATOR: "ADMINISTRATOR";
  OWNER: "OWNER";
};

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const TaskType: {
  DEMONSTRATE: "DEMONSTRATE";
  EXPERIMENT: "EXPERIMENT";
};

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const UserSitewideRole: {
  BANNED: "BANNED";
  GENERAL: "GENERAL";
  ENDMINISTRATOR: "ENDMINISTRATOR";
};

export type UserSitewideRole = (typeof UserSitewideRole)[keyof typeof UserSitewideRole];

export type RoleKey = string | ({
  group: string;
  name: string;
});

export interface ItemBaseV1 {
  id: string;
  type: string;
  parent?: string;
}

export interface DemonstrationCustomRoleV1 {
  name: string;
  display?: RoleDisplay;
}

export interface CyMessageSynthesisDescriptionV1 {
  synthesizer: string;
  editedByUser?: boolean;
  modelVersion?: string;
  generatedAt?: string;
  generationId?: string;
  stats?: {
    latency?: number;
    tokensUsed?: number;
  };
}

export interface CyMessageItemV1 extends ItemBaseV1 {
  type: "cy:message";
  role: RoleKey;
  content: object;
  synthesis?: CyMessageSynthesisDescriptionV1;
}

export interface CyMessageCandidatesItemV1 extends ItemBaseV1 {
  type: "cy:message-candidates";
  candidates: Array<Pick<CyMessageItemV1, "role" | "content">>;
  selected: number;
  synthesis?: CyMessageSynthesisDescriptionV1;
}

export type CyFunctionCallOutputV1 = ({
  success: true;
} & ({
  display: "none";
} | {
  display: "string";
  data: string;
} | {
  display: "json";
  data: object;
} | {
  display: "pyke:search-results";
  answer?: string;
  results: Array<{
    url: string;
    favicon?: string;
    title: string;
    content: string;
  }>;
})) | {
  success: false;
  error: string;
};

export type CyFunctionCallArgumentV1 = {
  arg: string | number;
} & ({
  type: "string";
  value: string;
} | {
  type: "number";
  value: number;
} | {
  type: "role";
  role: RoleKey;
});

export interface CyFunctionCallItemV1 extends ItemBaseV1 {
  type: "cy:function-call";
  func: string;
  arguments: Array<CyFunctionCallArgumentV1>;
  output: CyFunctionCallOutputV1 | null;
  persist?: boolean;
}

export type ItemV1 = CyMessageItemV1 | CyMessageCandidatesItemV1 | CyFunctionCallItemV1;

export interface DemonstrationContentV1 {
  version: 1;
  items?: Array<ItemV1>;
  customRoles?: Record<string, Array<DemonstrationCustomRoleV1>>;
  initialTaskConfig?: Pick<TaskConfigV1, "roles" | "editorFeatures">;
}

export type DemonstrationContent = DemonstrationContentV1;

export interface EditorTextStyles {
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  underline?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  highlight?: boolean;
  link?: boolean;
  inlineCode?: boolean;
  color?: boolean;
}

export interface BaseEditorFeature {
  id: string;
}

export interface EditorTokenGroupFeature extends BaseEditorFeature {
  type: "cy:token-group";
  categoryIcon?: string;
  tokens?: {
    [k in string]: {
      label: string;
      icon?: {
        type: "SVG";
        path: string;
      } | {
        type: "EMOTICON";
        content: string;
      } | {
        type: "RESOURCE";
        rid: string;
      };
      color?: (readonly ["gray", "gold", "bronze", "brown", "yellow", "amber", "orange", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "iris", "indigo", "blue", "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky"])[number];
    };
  };
  baseColor?: (readonly ["gray", "gold", "bronze", "brown", "yellow", "amber", "orange", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "iris", "indigo", "blue", "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky"])[number];
}

export interface EditorArbitraryTokenFeature extends BaseEditorFeature {
  type: "cy:arbitrary-tokens";
}

export interface EditorCustomRemoteEmojiFeature extends BaseEditorFeature {
  type: "cy:custom-remote-emoji";
}

export interface EditorYouTubeEmbedFeature extends BaseEditorFeature {
  type: "cy:youtube-embed";
}

export type EditorFeature = EditorTokenGroupFeature | EditorArbitraryTokenFeature | EditorCustomRemoteEmojiFeature | EditorYouTubeEmbedFeature;

export interface EditorFeatures {
  styles?: EditorTextStyles;
  features?: Array<EditorFeature>;
  mentions?: {
    includeRoles?: boolean;
    options?: Array<string>;
  };
}

export interface ProjectDemonstrationTypeDefaults {
  privacy?: DemonstrationPrivacy;
  collabAbility?: DemonstrationCollaboratorAbility;
}

export interface ProjectConfigV1 {
  version: 1;
  defaultTaskConfig: Omit<TaskConfigV1, "version">;
  demonstrations?: {
    mustUseTask?: boolean;
    defaults?: ProjectDemonstrationTypeDefaults;
  };
  experiments?: {
    mustUseTask?: boolean;
    canConvertToDemonstrations?: "users" | "moderators";
    defaults?: ProjectDemonstrationTypeDefaults;
  };
}

export type ProjectConfig = ProjectConfigV1;

export type KnownOrCustomRole = {
  kind: "known";
  key: RoleKey;
} | ({
  kind: "custom";
  group: string;
} & DemonstrationCustomRoleV1);

export interface RemoteTaskSeedCall {
  ev: "seed";
  initiator: {
    id: string;
  };
  source: {
    init: "TASK";
    id: string;
  } | {
    init: "FREE";
    type: DemonstrationType;
  };
}

export interface RemoteTaskSeedResponse {
  title?: string;
  content: DemonstrationContent;
}

export interface RemoteSynthesisCall {
  ev: "synthesize";
  initiator: {
    id: string;
  };
  demonstration: {
    id: string;
    type: DemonstrationType;
    taskId?: string;
    content: DemonstrationContentV1;
  };
  synthesizer: string;
  creativity?: number;
  role?: RoleKey;
}

export type RemoteSynthesisEvent = {
  ev: "start";
  candidates: Array<{
    role: KnownOrCustomRole;
  }>;
  modelVersion?: string;
  generationId?: string;
} | {
  ev: "content";
  idx: number;
  patch: Array<{
    op: "replace" | "remove" | "add" | "delta";
    path: Array<(string | number)>;
    value?: any;
  }>;
} | {
  ev: "finish";
  tokensUsed?: number;
} | {
  ev: "error";
  message: string;
};

export interface RemotePingCall {
  ev: "ping";
}

export interface RemoteRoleGenerationCall {
  ev: "generateRole";
  initiator: {
    id: string;
  };
  demonstration: {
    id: string;
    type: DemonstrationType;
    taskId?: string;
  };
}

export interface RemoteRoleGenerationResponse {
  role: DemonstrationCustomRoleV1;
  synthesis?: {
    suppressAuto?: boolean;
  };
}

export interface RemoteFunctionCall {
  ev: "functionCall";
  initiator: {
    id: string;
  };
  demonstration: {
    id: string;
    type: DemonstrationType;
    taskId?: string;
    content: DemonstrationContentV1;
  };
  func: string;
  arguments: Array<CyFunctionCallArgumentV1>;
}

export interface RemoteFunctionCallResponse {
  output: CyFunctionCallOutputV1;
  persist?: boolean;
}

export type RemoteCall = RemoteTaskSeedCall | RemoteSynthesisCall | RemotePingCall | RemoteRoleGenerationCall | RemoteFunctionCall;

export interface TaskOptions {
  goal?: {
    target: number;
    deadline: number;
    disableOnCompletion?: boolean;
  };
  manager?: {
    balancingFactor?: number;
  };
}

export type NextRole = string | ({
  group: string;
} & ({
  name: string;
} | {
  tag: "custom" | "random";
}));

export interface RoleDisplay {
  flipSide?: boolean;
  color?: (readonly ["gray", "gold", "bronze", "brown", "yellow", "amber", "orange", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "iris", "indigo", "blue", "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky"])[number];
  icon?: {
    type: "SVG";
    path: string;
  } | {
    type: "URL";
    url: string;
  } | {
    type: "RESOURCE";
    rid: string;
  };
}

export interface RoleSynthesisConfig {
  suppressAuto?: boolean;
  disable?: boolean;
}

export interface IndividualRole {
  name: string;
  next?: NextRole;
  display?: RoleDisplay;
  synthesis?: RoleSynthesisConfig;
}

export interface RoleGroup {
  label: string;
  knownRoles?: Array<IndividualRole>;
  random?: {
    sourceEndpoint?: string;
    synthesis?: RoleSynthesisConfig;
  };
  custom?: {
    default?: IndividualRole;
  };
}

export interface Synthesizer {
  displayName?: string;
  url: string;
}

export type FunctionParameter = {
  name: string;
  displayName: string;
  required: boolean;
  description?: string;
} & ({
  type: "string";
  default?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
} | {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  integer?: boolean;
} | {
  type: "role";
  groups?: Array<string>;
});

export interface FunctionConfig {
  name: string;
  endpoint: string;
  icon?: {
    type: "SVG";
    path: string;
  };
  description?: string;
  parameters: Array<FunctionParameter>;
}

export interface TaskConfigV1 {
  version: 1;
  roles?: {
    individual?: Record<string, IndividualRole>;
    groups?: Record<string, RoleGroup>;
  };
  editorFeatures?: EditorFeatures;
  seed?: {
    url?: string;
  };
  synthesizers?: Record<string, Synthesizer>;
  functions?: Record<string, FunctionConfig>;
}

export type TaskConfig = TaskConfigV1;
