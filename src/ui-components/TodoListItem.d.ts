
import * as React from 'react';

import { FlexProps, ViewProps, TextProps } from '@aws-amplify/ui-react';

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

export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;

export declare type TodoListItemOverridesProps = {
  'Rectangle 2'?: PrimitiveOverrideProps<ViewProps>;
  'Todo content'?: PrimitiveOverrideProps<TextProps>;
  'Due'?: PrimitiveOverrideProps<TextProps>;
  'Frame 3'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type TodoListItemProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: TodoListItemOverridesProps | undefined | null;
}>;

export default function TodoListItem(props: TodoListItemProps): React.ReactElement;
  