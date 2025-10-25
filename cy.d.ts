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

export const UserProjectRole: {
  BANNED: "BANNED";
  GENERAL: "GENERAL";
  MODERATOR: "MODERATOR";
  ADMINISTRATOR: "ADMINISTRATOR";
  OWNER: "OWNER";
};

export type UserProjectRole = (typeof UserProjectRole)[keyof typeof UserProjectRole];

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

export interface Demonstration {
  id: string;
  type: DemonstrationType;
  title: string;
  task: Task | null;
  createdAt: Date;
  updatedAt: Date;
  privacy: DemonstrationPrivacy;
  review: DemonstrationReviewState;
  collabAbility: DemonstrationCollaboratorAbility;
  frozen: DemonstrationFreezeState;
  author: ProjectUser | null;
  participants: Array<ProjectUser>;
}

export interface FullDemonstration extends Demonstration {
  project: Project;
  content: DemonstrationContent;
}

export interface ItemBaseV1 {
  id: string;
  type: string;
  parent?: string;
}

export interface CyMessageRoleDefinitionV1 {
  group: string;
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
  role: CyMessageRoleDefinitionV1;
  content: any;
  synthesis?: CyMessageSynthesisDescriptionV1;
}

export interface CyMessageCandidatesItemV1 extends ItemBaseV1 {
  type: "cy:message-candidates";
  candidates: Array<Pick<CyMessageItemV1, "role" | "content">>;
  selected: number;
  synthesis?: CyMessageSynthesisDescriptionV1;
}

export type ItemV1 = CyMessageItemV1 | CyMessageCandidatesItemV1;

export interface DemonstrationContentV1 {
  version: 1;
  items?: Array<ItemV1>;
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

export interface Project {
  id: string;
  displayName: string;
  iconRid: string | null;
  privacy: ProjectPrivacy;
  config: ProjectConfig;
  privilege?: UserProjectRole | null;
}

export interface ProjectUser {
  privilege: UserProjectRole | null;
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

export interface RemoteTaskSeedCall {
  ev: "task:seed";
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
  ev: "demonstration:synthesize";
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
  role?: CyMessageRoleDefinitionV1;
}

export type RemoteSynthesisEvent = {
  ev: "start";
  candidates: Array<{
    role: CyMessageRoleDefinitionV1;
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
  ev: "cygnus:ping";
}

export interface RemoteRoleGenerationCall {
  ev: "role:generate";
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
  role: Omit<CyMessageRoleDefinitionV1, "group">;
  synthesis?: {
    suppressAuto?: boolean;
  };
}

export type RemoteCall = RemoteTaskSeedCall | RemoteSynthesisCall | RemotePingCall | RemoteRoleGenerationCall;

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
  goal: number | null;
}

export type RoleKey = string | ({
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
  next?: RoleKey;
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
}

export type TaskConfig = TaskConfigV1;

export interface User {
  id: string;
  createdAt: Date;
  display: string | null;
  username: string;
  avatarRid: string | null;
  sitewideRole: UserSitewideRole;
}
