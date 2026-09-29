
import { CUSTOMER_HEADER_HEIGHT } from "@/components/CustomerHeader";
import { colors, spacing, typography } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsConditionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top + CUSTOMER_HEADER_HEIGHT + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms and Conditions</Text>

        <Text style={styles.updated}>
          Last updated: September 22, 2026
        </Text>

        <Text style={styles.paragraph}>
          These Terms and Conditions ("Terms") govern your access to and
          use of the Logix Solutionz mobile application ("App") and the
          services made available through it.
        </Text>

        <Text style={styles.paragraph}>
          By creating an account, accessing, or using the App, you agree
          to these Terms. If you do not agree with these Terms, you should
          not use the App.
        </Text>

        <Text style={styles.sectionTitle}>
          1. Eligibility and Account
        </Text>

        <Text style={styles.paragraph}>
          You are responsible for providing accurate and complete
          information when creating or maintaining your account.
        </Text>

        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your
          login credentials and for activities performed through your
          account, except where unauthorized activity results from causes
          outside your reasonable control.
        </Text>

        <Text style={styles.paragraph}>
          You must notify us promptly if you believe that your account has
          been accessed without authorization.
        </Text>

        <Text style={styles.sectionTitle}>
          2. Use of the App
        </Text>

        <Text style={styles.paragraph}>
          You agree to use the App only for lawful purposes and in
          accordance with these Terms and applicable laws and regulations.
        </Text>

        <Text style={styles.paragraph}>
          You must not misuse the App, attempt to gain unauthorized access
          to systems or accounts, interfere with the operation of the App,
          submit malicious content, or use the App in a way that could
          harm the Company, its systems, service providers, personnel, or
          other users.
        </Text>

        <Text style={styles.sectionTitle}>
          3. Products and Orders
        </Text>

        <Text style={styles.paragraph}>
          The App may allow you to browse products, add products to a
          cart, place orders, provide delivery information, and view order
          status and order history.
        </Text>

        <Text style={styles.paragraph}>
          Product availability, prices, discounts, promotions, delivery
          availability, and other order information may change from time
          to time.
        </Text>

        <Text style={styles.paragraph}>
          Placing an order through the App does not necessarily guarantee
          acceptance of the order. Orders may be subject to availability,
          verification, payment confirmation, operational limitations, or
          other applicable conditions.
        </Text>

        <Text style={styles.sectionTitle}>
          4. Order Cancellation and Changes
        </Text>

        <Text style={styles.paragraph}>
          Orders may be cancelled, modified, rejected, or otherwise
          handled according to the applicable order status, business
          procedures, product availability, payment status, and delivery
          conditions.
        </Text>

        <Text style={styles.paragraph}>
          Where a cancellation, refund, or order adjustment is applicable,
          it will be handled according to the relevant business policy
          and applicable law.
        </Text>

        <Text style={styles.sectionTitle}>
          5. Prices and Payments
        </Text>

        <Text style={styles.paragraph}>
          Prices and applicable charges displayed in the App may include
          product prices, discounts, delivery charges, taxes, or other
          applicable amounts.
        </Text>

        <Text style={styles.paragraph}>
          You are responsible for providing accurate payment information
          and completing any required payment or verification process.
        </Text>

        <Text style={styles.paragraph}>
          Where proof of payment is required, you may be asked to submit
          a payment screenshot or other payment-related information.
          Submitted payment proof may be reviewed by authorized
          administrative personnel for verification and order processing.
        </Text>

        <Text style={styles.sectionTitle}>
          6. Delivery and Location
        </Text>

        <Text style={styles.paragraph}>
          You are responsible for providing accurate delivery information.
          The App may request location permission to help you select or
          confirm your delivery location.
        </Text>

        <Text style={styles.paragraph}>
          For rider or delivery personnel functionality, location
          information may be used to support delivery operations and
          navigation.
        </Text>

        <Text style={styles.paragraph}>
          We are not responsible for delivery delays or failures caused
          by incorrect information supplied by you, unavailable
          recipients, inaccessible locations, force majeure events, or
          circumstances outside our reasonable control.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Account Deletion
        </Text>

        <Text style={styles.paragraph}>
          You may request deletion of your account through the account
          deletion functionality provided in the App.
        </Text>

        <Text style={styles.paragraph}>
          Once your account deletion has been successfully processed, the
          deleted account will no longer be available for normal login or
          access through the App.
        </Text>

        <Text style={styles.paragraph}>
          You will not be able to access the deleted account's profile,
          account-specific features, or other functionality associated
          with that account after deletion.
        </Text>

        <Text style={styles.paragraph}>
          Account deletion does not necessarily mean that every historical
          business or transaction record is immediately erased. Certain
          records may need to be retained where reasonably necessary for
          legitimate purposes such as security, fraud prevention,
          accounting, dispute resolution, legal obligations, regulatory
          requirements, or maintaining necessary transaction records.
        </Text>

        <Text style={styles.paragraph}>
          Where such records are retained, we will handle them in
          accordance with our Privacy Policy and applicable requirements.
        </Text>

        <Text style={styles.paragraph}>
          If you want to use the App again after your account has been
          deleted, you may need to create a new account.
        </Text>

        <Text style={styles.sectionTitle}>
          8. User-Submitted Content
        </Text>

        <Text style={styles.paragraph}>
          You may submit information or content through the App, including
          profile photographs, payment screenshots, ratings, remarks,
          delivery information, and other information associated with
          your use of the services.
        </Text>

        <Text style={styles.paragraph}>
          You are responsible for ensuring that information and content you
          submit is accurate, lawful, and does not violate the rights of
          another person or organization.
        </Text>

        <Text style={styles.sectionTitle}>
          9. Ratings and Reviews
        </Text>

        <Text style={styles.paragraph}>
          Where rating or review functionality is available, your
          submitted rating, remarks, or feedback may be associated with
          the relevant order or service and may be accessible to
          authorized personnel for service management and improvement.
        </Text>

        <Text style={styles.paragraph}>
          You must not submit abusive, unlawful, fraudulent, threatening,
          discriminatory, misleading, or otherwise inappropriate content.
        </Text>

        <Text style={styles.sectionTitle}>
          10. Intellectual Property
        </Text>

        <Text style={styles.paragraph}>
          Unless otherwise stated, the App, its software, design,
          interface, branding, logos, text, graphics, and other materials
          are owned by or licensed to the Company and are protected by
          applicable intellectual property laws.
        </Text>

        <Text style={styles.paragraph}>
          You may use the App only for its intended purposes. You may not
          copy, modify, distribute, reverse engineer, reproduce, sell, or
          commercially exploit the App or its protected materials except
          where expressly permitted by applicable law or by us in writing.
        </Text>

        <Text style={styles.sectionTitle}>
          11. Third-Party Services
        </Text>

        <Text style={styles.paragraph}>
          The App may rely on third-party services, platforms, software,
          authentication providers, notification services, hosting
          providers, routing services, or other technology providers.
        </Text>

        <Text style={styles.paragraph}>
          Your use of third-party services may be subject to the
          applicable third party's own terms and policies.
        </Text>

        <Text style={styles.sectionTitle}>
          12. Availability and Service Changes
        </Text>

        <Text style={styles.paragraph}>
          We may update, modify, suspend, or discontinue portions of the
          App or its services from time to time, including for
          maintenance, security, operational, technical, or business
          reasons.
        </Text>

        <Text style={styles.paragraph}>
          We do not guarantee that the App will always be available,
          uninterrupted, error-free, or compatible with every device or
          network environment.
        </Text>

        <Text style={styles.sectionTitle}>
          13. Security and Unauthorized Use
        </Text>

        <Text style={styles.paragraph}>
          You must not attempt to bypass security controls, access
          another user's account, interfere with servers or networks,
          introduce malicious software, scrape protected information, or
          otherwise misuse the App or its services.
        </Text>

        <Text style={styles.paragraph}>
          We may suspend or restrict access where we reasonably believe
          that an account or activity presents a security risk, involves
          fraud or misuse, or violates these Terms or applicable law.
        </Text>

        <Text style={styles.sectionTitle}>
          14. Account Suspension or Termination
        </Text>

        <Text style={styles.paragraph}>
          We may restrict, suspend, or terminate access to an account when
          reasonably necessary because of suspected fraud, abuse,
          unauthorized activity, violation of these Terms, legal
          requirements, security concerns, or other legitimate operational
          reasons.
        </Text>

        <Text style={styles.paragraph}>
          Account termination or deletion may prevent access to
          account-specific information and services.
        </Text>

        <Text style={styles.sectionTitle}>
          15. Disclaimer
        </Text>

        <Text style={styles.paragraph}>
          To the extent permitted by applicable law, the App and its
          services are provided on an "as available" basis. We do not
          guarantee that every feature will always operate without
          interruption, delay, or error.
        </Text>

        <Text style={styles.paragraph}>
          Information displayed through the App may depend on data
          received from backend systems, service providers, inventory
          systems, payment verification processes, delivery operations,
          or other sources.
        </Text>

        <Text style={styles.sectionTitle}>
          16. Limitation of Liability
        </Text>

        <Text style={styles.paragraph}>
          To the maximum extent permitted by applicable law, the Company
          will not be responsible for indirect, incidental, special,
          consequential, or unforeseeable losses arising from your use of
          the App, except where such limitation is prohibited by law.
        </Text>

        <Text style={styles.paragraph}>
          Nothing in these Terms is intended to exclude or limit any
          liability or legal right that cannot lawfully be excluded or
          limited.
        </Text>

        <Text style={styles.sectionTitle}>
          17. Privacy
        </Text>

        <Text style={styles.paragraph}>
          Your use of the App is also subject to our Privacy Policy, which
          explains how we collect, use, store, protect, retain, and delete
          information.
        </Text>

        <Text style={styles.sectionTitle}>
          18. Changes to These Terms
        </Text>

        <Text style={styles.paragraph}>
          We may update these Terms from time to time to reflect changes
          to the App, our services, legal requirements, or business
          practices.
        </Text>

        <Text style={styles.paragraph}>
          When changes are made, we may update the "Last updated" date
          shown at the beginning of these Terms. Continued use of the App
          after an update may constitute acceptance of the updated Terms
          to the extent permitted by applicable law.
        </Text>

        <Text style={styles.sectionTitle}>
          19. Contact Us
        </Text>

        <Text style={styles.paragraph}>
          If you have questions about these Terms and Conditions, please
          contact us at:
        </Text>

        <Text style={styles.contact}>
          Email: adnanali1990@gmail.com
        </Text>

        <Text style={styles.paragraph}>
          We will review questions and requests and respond as
          appropriate.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  updated: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },

  contact: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: spacing.sm,
  },
});
