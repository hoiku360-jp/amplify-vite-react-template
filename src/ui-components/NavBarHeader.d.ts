
import * as React from 'react';
import { LogoWithTextProps } from "./LogoWithText";
import { MyIconProps } from "./MyIcon";
import { FlexProps, TextProps, ImageProps } from '@aws-amplify/ui-react';

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

export declare type NavBarHeaderOverridesProps = {
  'LogoWithText'?: LogoWithTextProps;
  'Dashboard'?: PrimitiveOverrideProps<TextProps>;
  'Jobs'?: PrimitiveOverrideProps<TextProps>;
  'Applicants'?: PrimitiveOverrideProps<TextProps>;
  'Company'?: PrimitiveOverrideProps<TextProps>;
  'Frame 32129767076'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon'?: MyIconProps;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Frame 32129767081'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type NavBarHeaderProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: NavBarHeaderOverridesProps | undefined | null;
}>;

export default function NavBarHeader(props: NavBarHeaderProps): React.ReactElement;
  