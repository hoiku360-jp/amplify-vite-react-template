
import * as React from 'react';

import { IconProps } from '@aws-amplify/ui-react';

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

export declare type MyIconOverridesProps = {

} & EscapeHatchProps;

export declare type MyIconProps = React.PropsWithChildren<Partial<IconProps> & {
  type?: 'warning' | 'alert' | 'info' | 'chat' | 'checkmark' | 'favorite_border' | 'more_vert' | 'bookmark_border' | 'share' | 'arrow-right' | 'reply' | 'chat-bubble-outline' | 'send' | 'favorite' | 'shuffle' | 'more_horiz' | 'group' | 'close' | 'shopping_bag' | 'delete' | 'edit' | 'dashboard' | 'settings' | 'notification' | 'twitter' | 'instagram' | 'email' | 'phone' | 'location' | 'content' | 'file' | 'storage' | 'function' | 'authentication' | 'data' | 'home';
  overrides?: MyIconOverridesProps | undefined | null;
}>;

export default function MyIcon(props: MyIconProps): React.ReactElement;
  