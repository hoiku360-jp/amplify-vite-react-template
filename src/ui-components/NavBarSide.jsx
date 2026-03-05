import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Image } from '@aws-amplify/ui-react';
import LogoWithText from './LogoWithText';
import MyIcon from './MyIcon';

export default function NavBarSide(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="10px"
    direction="row"
    width="385px"
    height="762px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    padding="32px 0px 32px 0px"
    {...getOverrideProps(overrides, "NavBarSide")}
    {...rest}
  >
    <Flex
      gap="32px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      grow="1"
      shrink="1"
      basis="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 32129767087")}
    >
      <Flex
        gap="32px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        grow="1"
        shrink="1"
        basis="0"
        alignSelf="stretch"
        position="relative"
        padding="0px 32px 0px 32px"
        {...getOverrideProps(overrides, "Frame 32129767088")}
      >
        <LogoWithText
          color="brand"
          {...getOverrideProps(overrides, "LogoWithText")}
        />
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 414")}
        >
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Frame 322")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39443712")}
            >
              <MyIcon
                type="home"
                {...getOverrideProps(overrides, "MyIcon39443713")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label29767099")}
            >
              Home
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Section29767100")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "label29767101")}
          >
            Manage
          </Text>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link29767103")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39433519")}
            >
              <MyIcon
                type="content"
                {...getOverrideProps(overrides, "MyIcon39433520")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label29767106")}
            >
              Content
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link29767111")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39433544")}
            >
              <MyIcon
                type="group"
                {...getOverrideProps(overrides, "MyIcon39433545")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              width="100px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label29767114")}
            >
              Users
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link29767107")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39433565")}
            >
              <MyIcon
                type="file"
                {...getOverrideProps(overrides, "MyIcon39433566")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label29767110")}
            >
              Files
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Section39433431")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "label39433432")}
          >
            Set up
          </Text>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39433433")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39443602")}
            >
              <MyIcon
                type="data"
                {...getOverrideProps(overrides, "MyIcon39443603")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39433436")}
            >
              Data
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39433437")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39443623")}
            >
              <MyIcon
                type="storage"
                {...getOverrideProps(overrides, "MyIcon39443624")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              width="100px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39433440")}
            >
              Storage
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39433441")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39443644")}
            >
              <MyIcon
                type="authentication"
                {...getOverrideProps(overrides, "MyIcon39443645")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39433444")}
            >
              Authentication
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        gap="32px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 32129767135")}
      >
        <Flex
          gap="9px"
          direction="row"
          width="385px"
          justifyContent="flex-start"
          alignItems="center"
          shrink="0"
          position="relative"
          padding="0px 32px 0px 32px"
          {...getOverrideProps(overrides, "Frame 416")}
        >
          <Flex
            gap="16px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            {...getOverrideProps(overrides, "Frame 415")}
          >
            <Image
              width="48px"
              height="48px"
              display="block"
              shrink="0"
              position="relative"
              borderRadius="40px"
              objectFit="cover"
              alt=""
              {...getOverrideProps(overrides, "Rectangle 1163")}
            />
            <Flex
              gap="0"
              direction="column"
              width="100px"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              {...getOverrideProps(overrides, "Frame 32129767140")}
            >
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
                {...getOverrideProps(overrides, "Wesley Peck")}
              >
                Wesley Peck
              </Text>
            </Flex>
          </Flex>
          <MyIcon
            type="settings"
            {...getOverrideProps(overrides, "MyIcon39173440")}
          />
        </Flex>
      </Flex>
    </Flex>
  </Flex>
  )
}
