import * as React from "react";

import { FlexProps, TextProps } from "@aws-amplify/ui-react";

export declare type EscapeHatchProps = {
  [elementHierarchy: string]: Record<string, unknown>;
} | null;

export declare type VariantValues = {
  [key: string]: string;
};
export declare type Variant = {
  variantValues: VariantValues;
  overrides: EscapeHatchProps;
};

export declare type PrimitiveOverrideProps<T> = Partial<T> &
  React.DOMAttributes<HTMLDivElement>;

export declare type BoardCardOverridesProps = {
  "Board title"?: PrimitiveOverrideProps<TextProps>;
  "Board description"?: PrimitiveOverrideProps<TextProps>;
  "Updated at"?: PrimitiveOverrideProps<TextProps>;
} & EscapeHatchProps;

export declare type BoardCardProps = React.PropsWithChildren<
  Partial<FlexProps> & {
    overrides?: BoardCardOverridesProps | undefined | null;
  }
>;

export default function BoardCard(props: BoardCardProps): React.ReactElement;
