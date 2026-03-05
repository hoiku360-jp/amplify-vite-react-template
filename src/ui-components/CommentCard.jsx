import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Image } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function CommentCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="column"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    padding="16px 16px 16px 16px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "CommentCard")}
    {...rest}
  >
    <Flex
      gap="16px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Liked")}
    >
      <Flex
        gap="9px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "User Liked")}
      >
        <MyIcon
          type="favorite"
          {...getOverrideProps(overrides, "MyIcon29766875")}
        />
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Danny liked this")}
        >
          Danny liked this
        </Text>
      </Flex>
    </Flex>
    <Flex
      gap="16px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Body")}
    >
      <Image
        width="80px"
        height="80px"
        display="block"
        shrink="0"
        position="relative"
        borderRadius="64px"
        objectFit="cover"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
      <Flex
        gap="8px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame29766879")}
      >
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame29766880")}
        >
          <Flex
            gap="16px"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Frame29766881")}
          >
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="700"
              color="rgba(13,26,38,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "Scott")}
            >
              Scott
            </Text>
          </Flex>
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-end"
            alignItems="flex-start"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            {...getOverrideProps(overrides, "Frame29766885")}
          >
            <MyIcon
              type="more_horiz"
              {...getOverrideProps(overrides, "MyIcon29766886")}
            />
          </Flex>
        </Flex>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "“Lorem ipsum dolor sit amet, consectetur adipiscing elit. ”")}
        >
          “Lorem ipsum dolor sit amet, consectetur adipiscing elit. ”
        </Text>
      </Flex>
    </Flex>
    <Flex
      gap="80px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Share29766888")}
    >
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Share29766889")}
      >
        <MyIcon
          type="reply"
          {...getOverrideProps(overrides, "MyIcon29766890")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "9929766891")}
        >
          99
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Repost")}
      >
        <MyIcon
          type="shuffle"
          {...getOverrideProps(overrides, "MyIcon29766893")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "9929766894")}
        >
          99
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Like")}
      >
        <MyIcon
          type="favorite_border"
          {...getOverrideProps(overrides, "MyIcon29766896")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "9929766897")}
        >
          99
        </Text>
      </Flex>
      <MyIcon
        type="share"
        {...getOverrideProps(overrides, "MyIcon29766898")}
      />
    </Flex>
  </Flex>
  )
}
