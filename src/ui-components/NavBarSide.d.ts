
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

export declare type NavBarSideOverridesProps = {
  'LogoWithText'?: LogoWithTextProps;
  'MyIcon39443713'?: MyIconProps;
  'icon39443712'?: PrimitiveOverrideProps<FlexProps>;
  'label29767099'?: PrimitiveOverrideProps<TextProps>;
  'Frame 322'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 414'?: PrimitiveOverrideProps<FlexProps>;
  'label29767101'?: PrimitiveOverrideProps<TextProps>;
  'MyIcon39433520'?: MyIconProps;
  'icon39433519'?: PrimitiveOverrideProps<FlexProps>;
  'label29767106'?: PrimitiveOverrideProps<TextProps>;
  'link29767103'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39433545'?: MyIconProps;
  'icon39433544'?: PrimitiveOverrideProps<FlexProps>;
  'label29767114'?: PrimitiveOverrideProps<TextProps>;
  'link29767111'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39433566'?: MyIconProps;
  'icon39433565'?: PrimitiveOverrideProps<FlexProps>;
  'label29767110'?: PrimitiveOverrideProps<TextProps>;
  'link29767107'?: PrimitiveOverrideProps<FlexProps>;
  'Section29767100'?: PrimitiveOverrideProps<FlexProps>;
  'label39433432'?: PrimitiveOverrideProps<TextProps>;
  'MyIcon39443603'?: MyIconProps;
  'icon39443602'?: PrimitiveOverrideProps<FlexProps>;
  'label39433436'?: PrimitiveOverrideProps<TextProps>;
  'link39433433'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39443624'?: MyIconProps;
  'icon39443623'?: PrimitiveOverrideProps<FlexProps>;
  'label39433440'?: PrimitiveOverrideProps<TextProps>;
  'link39433437'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39443645'?: MyIconProps;
  'icon39443644'?: PrimitiveOverrideProps<FlexProps>;
  'label39433444'?: PrimitiveOverrideProps<TextProps>;
  'link39433441'?: PrimitiveOverrideProps<FlexProps>;
  'Section39433431'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 32129767088'?: PrimitiveOverrideProps<FlexProps>;
  'Rectangle 1163'?: PrimitiveOverrideProps<ImageProps>;
  'Wesley Peck'?: PrimitiveOverrideProps<TextProps>;
  'Frame 32129767140'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 415'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39173440'?: MyIconProps;
  'Frame 416'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 32129767135'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 32129767087'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type NavBarSideProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: NavBarSideOverridesProps | undefined | null;
}>;

export default function NavBarSide(props: NavBarSideProps): React.ReactElement;
  