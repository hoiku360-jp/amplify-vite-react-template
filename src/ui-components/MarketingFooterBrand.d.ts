
import * as React from 'react';
import { LogoWithTextProps } from "./LogoWithText";
import { FlexProps, TextProps, TextFieldProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type MarketingFooterBrandOverridesProps = {
  'Sign up for our newsletter'?: PrimitiveOverrideProps<TextProps>;
  'No spam. We promise.'?: PrimitiveOverrideProps<TextProps>;
  'Frame 434'?: PrimitiveOverrideProps<FlexProps>;
  'TextField'?: PrimitiveOverrideProps<TextFieldProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Frame 435'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 313'?: PrimitiveOverrideProps<FlexProps>;
  'Products'?: PrimitiveOverrideProps<TextProps>;
  'Libraries'?: PrimitiveOverrideProps<TextProps>;
  'CLI'?: PrimitiveOverrideProps<TextProps>;
  'Studio'?: PrimitiveOverrideProps<TextProps>;
  'Hosting'?: PrimitiveOverrideProps<TextProps>;
  'Frame 403'?: PrimitiveOverrideProps<FlexProps>;
  'Resources'?: PrimitiveOverrideProps<TextProps>;
  'Docs'?: PrimitiveOverrideProps<TextProps>;
  'Learn'?: PrimitiveOverrideProps<TextProps>;
  'Examples'?: PrimitiveOverrideProps<TextProps>;
  'Changelog'?: PrimitiveOverrideProps<TextProps>;
  'Frame 404'?: PrimitiveOverrideProps<FlexProps>;
  'Company'?: PrimitiveOverrideProps<TextProps>;
  'About us'?: PrimitiveOverrideProps<TextProps>;
  'Contact'?: PrimitiveOverrideProps<TextProps>;
  'Blog'?: PrimitiveOverrideProps<TextProps>;
  'Frame 40539414069'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 40539414056'?: PrimitiveOverrideProps<FlexProps>;
  'LogoWithText'?: LogoWithTextProps;
  '© 2023 AWS Amplify UI. All rights reserved.'?: PrimitiveOverrideProps<TextProps>;
  'Frame 433'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type MarketingFooterBrandProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: MarketingFooterBrandOverridesProps | undefined | null;
}>;

export default function MarketingFooterBrand(props: MarketingFooterBrandProps): React.ReactElement;
  