
import * as React from 'react';

import { FlexProps, IconProps, TextProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type NavBarHeader2OverridesProps = {
  'Union'?: PrimitiveOverrideProps<IconProps>;
  'Amplify Mark'?: PrimitiveOverrideProps<FlexProps>;
  'Home'?: PrimitiveOverrideProps<TextProps>;
  'Products'?: PrimitiveOverrideProps<TextProps>;
  'Pricing'?: PrimitiveOverrideProps<TextProps>;
  'Contact'?: PrimitiveOverrideProps<TextProps>;
  'Frame 5'?: PrimitiveOverrideProps<FlexProps>;
  'Button39493466'?: PrimitiveOverrideProps<ButtonProps>;
  'Button39493467'?: PrimitiveOverrideProps<ButtonProps>;
  'actions'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type NavBarHeader2Props = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: NavBarHeader2OverridesProps | undefined | null;
}>;

export default function NavBarHeader2(props: NavBarHeader2Props): React.ReactElement;
  