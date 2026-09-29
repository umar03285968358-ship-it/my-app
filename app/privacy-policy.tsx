
import { CUSTOMER_HEADER_HEIGHT } from "@/components/CustomerHeader";
import { colors, spacing, typography } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.updated}>
          Last updated: September 22, 2026
        </Text>

        <Text style={styles.paragraph}>
          This Privacy Policy explains how Logix Solutionz ("we", "us",
          "our", or "the Company") collects, uses, stores, protects, and
          handles information when you use the Logix Solutionz mobile
          application ("App").
        </Text>

        <Text style={styles.paragraph}>
          By using the App, you acknowledge that you have read and
          understood this Privacy Policy. If you do not agree with this
          Privacy Policy, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>
          1. Information We Collect
        </Text>

        <Text style={styles.subTitle}>
          1.1 Account and Profile Information
        </Text>

        <Text style={styles.paragraph}>
          When you create or use an account, we may collect information
          such as your first name, last name, mobile phone number, email
          address, password or authentication information, profile
          photograph, and other information that you provide as part of
          your account or profile.
        </Text>

        <Text style={styles.subTitle}>
          1.2 Google Sign-In Information
        </Text>

        <Text style={styles.paragraph}>
          If you choose to sign in using Google Sign-In, we receive the
          information made available to us through the Google
          authentication process, such as your name, email address,
          profile information, and authentication-related identifiers as
          applicable.
        </Text>

        <Text style={styles.paragraph}>
          We use this information to authenticate your account and provide
          access to the App. We do not receive your Google password.
        </Text>

        <Text style={styles.subTitle}>
          1.3 Delivery Address and Location Information
        </Text>

        <Text style={styles.paragraph}>
          The App may request access to your device's location while you
          use features that require location information, including
          selecting or confirming a delivery location.
        </Text>

        <Text style={styles.paragraph}>
          Location information may include geographic coordinates such as
          latitude and longitude. We use this information to support
          delivery-related functionality, including helping identify or
          confirm the delivery location associated with an order.
        </Text>

        <Text style={styles.paragraph}>
          For users operating as riders or delivery personnel, location
          information may also be used for rider location and delivery
          navigation functionality.
        </Text>

        <Text style={styles.subTitle}>
          1.4 Photos, Camera, and Media
        </Text>

        <Text style={styles.paragraph}>
          The App may request access to your camera when you choose to
          capture an image, and access to your device's photo or media
          library when you choose to select an existing image.
        </Text>

        <Text style={styles.paragraph}>
          Images may be used for features such as updating your profile
          photograph or submitting a payment screenshot associated with an
          order, where applicable.
        </Text>

        <Text style={styles.paragraph}>
          We do not access your camera or photo library continuously. These
          permissions are requested when you use a feature that requires
          them.
        </Text>

        <Text style={styles.subTitle}>
          1.5 Order and Transaction Information
        </Text>

        <Text style={styles.paragraph}>
          When you place an order, we may collect and process information
          related to the order, including products, quantities, prices,
          discounts, delivery information, order status, payment method,
          payment-related information, ratings, remarks, and other
          information necessary to process and manage your order.
        </Text>

        <Text style={styles.subTitle}>
          1.6 Payment Screenshots
        </Text>

        <Text style={styles.paragraph}>
          If you choose a payment method that requires proof of payment,
          you may upload a payment screenshot or image with your order.
          The submitted image is transmitted to our backend systems and
          may be accessible to authorized personnel through the
          administrative system for the purpose of verifying and
          processing the payment and order.
        </Text>

        <Text style={styles.subTitle}>
          1.7 Notifications and Device Information
        </Text>

        <Text style={styles.paragraph}>
          The App may use push notification services to send information
          such as order updates, notifications, and other service-related
          messages.
        </Text>

        <Text style={styles.paragraph}>
          To provide notification functionality, the App and its
          notification service provider may process information associated
          with your device and notification subscription, such as a
          notification or device identifier.
        </Text>

        <Text style={styles.sectionTitle}>
          2. Permissions Used by the App
        </Text>

        <Text style={styles.paragraph}>
          The App requests device permissions only when a feature requires
          access to the corresponding device functionality. You can
          manage or revoke applicable permissions through your Android
          device settings. Some features may not work correctly if a
          required permission is denied.
        </Text>

        <Text style={styles.permissionTitle}>
          Camera
        </Text>

        <Text style={styles.paragraph}>
          Camera access is used when you choose to capture an image, such
          as a profile photograph or another image required by an
          applicable feature.
        </Text>

        <Text style={styles.permissionTitle}>
          Photos and Media
        </Text>

        <Text style={styles.paragraph}>
          Photo or media access is used when you choose an image from your
          device, such as a profile photograph or payment screenshot.
        </Text>

        <Text style={styles.permissionTitle}>
          Location
        </Text>

        <Text style={styles.paragraph}>
          Location access is used for delivery-related functionality,
          including selecting or confirming customer delivery locations
          and supporting rider location and delivery navigation
          functionality.
        </Text>

        <Text style={styles.permissionTitle}>
          Notifications
        </Text>

        <Text style={styles.paragraph}>
          Notification permission may be requested so that the App can
          send order-related and service-related push notifications.
        </Text>

        <Text style={styles.permissionTitle}>
          Internet and Network Communication
        </Text>

        <Text style={styles.paragraph}>
          The App communicates with our backend services over the network
          to authenticate users, retrieve and submit application data,
          process orders, upload applicable images, provide notifications,
          and operate the App's online functionality.
        </Text>

        <Text style={styles.sectionTitle}>
          3. How We Use Information
        </Text>

        <Text style={styles.paragraph}>
          We may use collected information to:
        </Text>

        <Text style={styles.bullet}>
          • Create and manage your account.
        </Text>

        <Text style={styles.bullet}>
          • Authenticate your identity and maintain your session.
        </Text>

        <Text style={styles.bullet}>
          • Process and manage orders.
        </Text>

        <Text style={styles.bullet}>
          • Process deliveries and delivery locations.
        </Text>

        <Text style={styles.bullet}>
          • Verify payment information and submitted payment proof.
        </Text>

        <Text style={styles.bullet}>
          • Provide customer and rider functionality.
        </Text>

        <Text style={styles.bullet}>
          • Send order and service-related notifications.
        </Text>

        <Text style={styles.bullet}>
          • Provide customer support.
        </Text>

        <Text style={styles.bullet}>
          • Maintain and improve the App and related services.
        </Text>

        <Text style={styles.bullet}>
          • Detect, investigate, and prevent fraud, misuse, unauthorized
          access, or security incidents.
        </Text>

        <Text style={styles.bullet}>
          • Maintain appropriate business, transaction, accounting, legal,
          and security records where necessary.
        </Text>

        <Text style={styles.sectionTitle}>
          4. How We Share Information
        </Text>

        <Text style={styles.paragraph}>
          We do not sell your personal information.
        </Text>

        <Text style={styles.paragraph}>
          We may share or make information available to authorized
          personnel, service providers, and technology providers when
          reasonably necessary to operate, secure, maintain, or improve
          the App and its services.
        </Text>

        <Text style={styles.paragraph}>
          For example, information may be processed by service providers
          supporting authentication, push notifications, hosting,
          networking, image processing, or other technical services used
          by the App.
        </Text>

        <Text style={styles.paragraph}>
          Information may also be disclosed where required by applicable
          law, legal process, governmental request, or where reasonably
          necessary to protect the rights, safety, security, or property
          of users, the Company, or others.
        </Text>

        <Text style={styles.sectionTitle}>
          5. Order and Payment Information
        </Text>

        <Text style={styles.paragraph}>
          Information associated with your orders may be accessible to
          authorized personnel through our administrative systems for
          purposes such as order processing, payment verification,
          customer support, delivery management, accounting, and dispute
          resolution.
        </Text>

        <Text style={styles.paragraph}>
          Payment screenshots submitted through the App may therefore be
          viewed by authorized administrative personnel when required to
          verify the associated payment or order.
        </Text>

        <Text style={styles.sectionTitle}>
          6. Data Security
        </Text>

        <Text style={styles.paragraph}>
          We use reasonable technical and organizational measures
          designed to protect information against unauthorized access,
          alteration, disclosure, loss, or misuse.
        </Text>

        <Text style={styles.paragraph}>
          However, no electronic transmission, storage system, or online
          service can be guaranteed to be completely secure. You should
          also take reasonable steps to protect your account credentials
          and device.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Data Retention
        </Text>

        <Text style={styles.paragraph}>
          We retain information for as long as reasonably necessary to
          provide the App and its services, operate accounts, process
          orders, maintain security, resolve disputes, comply with legal
          or regulatory obligations, and maintain necessary business
          records.
        </Text>

        <Text style={styles.paragraph}>
          Where information is no longer required for these purposes, we
          will seek to delete it or otherwise handle it in accordance with
          applicable requirements and our operational procedures.
        </Text>

        <Text style={styles.sectionTitle}>
          8. Account Deletion
        </Text>

        <Text style={styles.paragraph}>
          You may request deletion of your account using the account
          deletion functionality provided within the App.
        </Text>

        <Text style={styles.paragraph}>
          When your account deletion request is successfully completed,
          your account will no longer be available for normal sign-in or
          access through the App. You will not be able to continue using
          the deleted account or access account features associated with
          that account.
        </Text>

        <Text style={styles.paragraph}>
          We will delete the personal and account information associated
          with the deleted account, subject to information that we are
          permitted or required to retain for legitimate purposes such as
          security, fraud prevention, legal obligations, regulatory
          requirements, accounting, dispute resolution, or necessary
          transaction records.
        </Text>

        <Text style={styles.paragraph}>
          Where retention of transaction or business records is necessary,
          we will retain only the information reasonably required for that
          purpose and, where appropriate, remove or anonymize information
          that is no longer necessary to identify the former account
          holder.
        </Text>

        <Text style={styles.paragraph}>
          Deleting your account does not automatically restore or preserve
          access to the deleted account. If you wish to use the App again
          after account deletion, you may need to create a new account,
          subject to the registration requirements applicable at that
          time.
        </Text>

        <Text style={styles.sectionTitle}>
          9. Children's Privacy
        </Text>

        <Text style={styles.paragraph}>
          The App is not intended to be used by children where such use is
          prohibited by applicable law. We do not knowingly request
          personal information from children for purposes that are not
          permitted by applicable law.
        </Text>

        <Text style={styles.sectionTitle}>
          10. Third-Party Services
        </Text>

        <Text style={styles.paragraph}>
          The App may use third-party services and software components to
          provide functionality such as authentication, push
          notifications, maps or routing, image handling, and technical
          services.
        </Text>

        <Text style={styles.paragraph}>
          These third-party services may process information according to
          their own privacy policies and applicable terms. We recommend
          reviewing the privacy practices of relevant third-party
          providers where appropriate.
        </Text>

        <Text style={styles.sectionTitle}>
          11. Your Choices
        </Text>

        <Text style={styles.paragraph}>
          You may control certain permissions through your device
          settings. You may also update certain account information
          through the App where those features are available.
        </Text>

        <Text style={styles.paragraph}>
          You may request account deletion using the account deletion
          functionality provided by the App.
        </Text>

        <Text style={styles.sectionTitle}>
          12. Changes to This Privacy Policy
        </Text>

        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time to reflect
          changes in the App, our services, legal requirements, or our
          privacy practices.
        </Text>

        <Text style={styles.paragraph}>
          When we make changes, we may update the "Last updated" date
          shown at the beginning of this Privacy Policy. You should review
          this Privacy Policy periodically for changes.
        </Text>

        <Text style={styles.sectionTitle}>
          13. Contact Us
        </Text>

        <Text style={styles.paragraph}>
          If you have questions, concerns, or requests regarding this
          Privacy Policy or the handling of your personal information,
          please contact us at:
        </Text>

        <Text style={styles.contact}>
          Email: adnanali1990@gmail.com
        </Text>

        <Text style={styles.paragraph}>
          We will review privacy-related requests and respond as
          appropriate under applicable requirements.
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

  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  permissionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },

  bullet: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: 6,
  },

  contact: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: spacing.sm,
  },
});
