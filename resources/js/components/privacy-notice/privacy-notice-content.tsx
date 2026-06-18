import type { ReactNode } from 'react';

type PrivacyNoticeContentProps = {
    compact?: boolean;
};

function PrivacyNoticeSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">{title}</h2>
            <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{children}</div>
        </section>
    );
}

export default function PrivacyNoticeContent({ compact = false }: PrivacyNoticeContentProps) {
    const sectionClassName = compact ? 'space-y-5' : 'space-y-8';
    const listClassName = 'list-disc space-y-2 pl-5';
    const listItemClassName = 'text-slate-700 dark:text-slate-300';
    const bulletColorClassName = 'marker:text-slate-700 dark:marker:text-slate-400';

    return (
        <div className={sectionClassName}>
            <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                <p>
                    The Department of Social Welfare and Development (DSWD) values your privacy and is dedicated to protecting your personal data in
                    compliance with Republic Act No. 10173 otherwise known as the &quot;Data Privacy Act of 2012&quot; (RA 10173) and its Implementing
                    Rules and Regulations, including the Circulars and Advisories issued by the National Privacy Commission (NPC).
                </p>
                <p>This Privacy Notice is issued in relation to the (state the purpose, legal basis).</p>
                <p>
                    This Privacy Notice provides details about our collection, use, sharing, security, disclosure, retention and disposal of personal
                    information in relation to the processing of personal and sensitive information with regard to (state the reason).
                </p>
                <p>
                    We shall ensure compliance with the strictest standards of security and confidentiality with respect to any and all personal
                    information submitted to us. This Data Privacy Policy also describes the security measures we adopted to safeguard your
                    information and how you can communicate with us regarding our privacy practices.
                </p>
            </div>

            <PrivacyNoticeSection title="Personal Data Collected and Manner of Collection">
                <p>
                    We collect the following personal and sensitive personal information from you when you electronically submit your applications,
                    inquiries, or requests using the CIP Forms platform, answer surveys, send email responses or any form of communications:
                </p>
                <ol className={`list-decimal space-y-2 pl-5 ${bulletColorClassName}`}>
                    <li className={listItemClassName}>List all information to be gathered.</li>
                </ol>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Personal Information of (Data Subject)">
                <p>
                    The DSWD seeks the consent of the (specific data subject) in collecting, using, or disclosing the personal information.
                    Data-subjects may contact us to inquire if we have collected their personal information other than what is stated in this notice.
                    You may also request that we stop the collection of personal information or for its deletion. Such requests are subject to our
                    satisfactory verification that the requestor is the parent or legal guardian of the data subject.
                </p>
                <p>
                    We may also collect your personal data from the verification system of our partners such as (applicable other departments,
                    agencies, bureaus, etc).
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Purpose for Processing of Personal Data">
                <p>
                    We are legally mandated to collect and process the abovementioned personal information and to (state purpose), pursuant to the
                    following:
                </p>
                <p>[Kindly include all the legal bases for collection and processing of personal and sensitive personal information]</p>
                <p>We also collect and process your submitted personal information for the following purposes:</p>
                <ul className={`${listClassName} ${bulletColorClassName}`}>
                    <li className={listItemClassName}>To fulfill our legal obligations;</li>
                    <li className={listItemClassName}>For internal record keeping and status tracking within the system;</li>
                    <li className={listItemClassName}>To respond to your inquiries or communications;</li>
                    <li className={listItemClassName}>To analyze, develop, and improve our regulatory services, systems, and tools;</li>
                    <li className={listItemClassName}>To prevent fraudulent transactions;</li>
                    <li className={listItemClassName}>To prevent causing any form of injury, financial or otherwise, to the applicant; and</li>
                    <li className={listItemClassName}>For other legitimate purposes and in furtherance of the foregoing.</li>
                </ul>
                <p>[Kindly include all purposes for the collection and processing of personal and sensitive personal information]</p>
                <p>
                    We process your personal data based on your consent. However, we may also process your personal data without your consent when it
                    aligns with our mandate, or when permitted under Sections 12 or 13 of the Data Privacy Act.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Use of Cookies">
                <p>
                    Cookies are small text files stored on your device that help us remember your preferences and improve website functionality. You
                    may opt not to receive cookies by not accepting or disabling them in your web browser configuration. Keep in mind, however, that
                    by doing such, you may not be able to use our website&apos;s full features.
                </p>
                <p>
                    Our website may contain links to third-party websites that may also use cookies. Should you use those links and leave our website,
                    please note that we have no control over such third-party sites, and their data privacy policy shall govern your use of their
                    site.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Disclosure of Personal Data">
                <p>
                    To comply with our legal obligations of protecting the children against all forms of abuse, we share necessary information with
                    the (agencies, etc). for verification of the authenticity of the documents you submitted.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Risks Involved">
                <p>
                    Risk refers to potential harm or danger to individuals or organizations. This can happen through unauthorized collection, use,
                    disclosure, or access to personal data, affecting confidentiality, integrity, and availability. We ensure security measures to
                    safeguard personal information, but absolute protection is not guaranteed, especially against cyberattacks or unauthorized access.
                </p>
                <p>
                    However, we have policies in place to manage security incidents, which align with existing National Privacy Commission (NPC)
                    policies, circulars, and other guidelines.
                </p>
                <p>
                    We also implement appropriate measures to ensure the protection of your children&apos;s personal data, taking into consideration
                    the best interests of the child.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Data Storage, Retention and Disposal">
                <p>
                    We store personal data on our secure computers and servers and we also use cloud-based third-party storage. We do not store
                    physical records in our storage or office premises.
                </p>
                <p>
                    We keep your personal data only for as long as necessary to fulfill the purpose/s for which they were collected, following our
                    Records Disposition Schedule.
                </p>
                <p>
                    After the retention period ends, we will securely dispose of your personal data according to our Records Disposition Schedule.
                    This includes either deleting or anonymizing electronic data to prevent any further use or access.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Data Subject Rights and Consent Withdrawal">
                <p>Under the Data Privacy Act, you, your minor children, and their travel companions have the following rights:</p>
                <ul className={`${listClassName} ${bulletColorClassName}`}>
                    <li className={listItemClassName}>
                        Right to be informed. You have the right to know how we collect, use, store, share, and dispose of your data. We share this
                        information with you through our Privacy Notices.
                    </li>
                    <li className={listItemClassName}>Right to object. You have the right to object to the processing of your or your child&apos;s personal data.</li>
                    <li className={listItemClassName}>
                        Right to access. You have the right to request information about how we use, store, disclose, or protect your personal data.
                    </li>
                    <li className={listItemClassName}>
                        Right to rectification. You have the right to request modifications or corrections to your or your child&apos;s personal data
                        if it is inaccurate, outdated, or false.
                    </li>
                    <li className={listItemClassName}>
                        Right to erasure or blocking. You have the right to request the deletion of your or your child&apos;s personal data or ask us
                        to stop using your data for specific purposes.
                    </li>
                    <li className={listItemClassName}>
                        Right to data portability. You have the right to request that we transfer your or your child&apos;s personal data to another
                        organization or directly to you under certain circumstances.
                    </li>
                    <li className={listItemClassName}>
                        Right to file a complaint and ask for damages. If you believe your or your child&apos;s rights as a data subject have been
                        violated or if you have suffered damages due to any issues with your personal data, you can reach out to our Data Privacy
                        Committee for assistance. If we cannot resolve your concerns or if you are unsatisfied with our response, you have the right
                        to file a complaint with the NPC.
                    </li>
                </ul>
                <p>
                    If you have privacy concerns, believe your personal data has been breached, feel your rights as a data subject have been violated,
                    or wish to exercise your data subject rights, including the withdrawal of your consent, fill out our Data Subject Request (DSR)
                    Form{' '}
                    <a
                        href="https://tinyurl.com/DSWD-DSR-Form"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-900 underline underline-offset-4 dark:text-blue-400"
                    >
                        https://tinyurl.com/DSWD-DSR-Form
                    </a>
                    .
                </p>
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Important Information:</p>
                    <ul className={`${listClassName} ${bulletColorClassName}`}>
                        <li className={listItemClassName}>
                            Scope of Withdrawal of Consent: Your personal data will no longer be processed for the purposes for which consent was
                            initially given.
                        </li>
                        <li className={listItemClassName}>
                            Consequences of Withdrawal of Consent: Withdrawing consent may affect our services, and some features requiring your data
                            may no longer be available.
                        </li>
                        <li className={listItemClassName}>
                            Further Processing: We may still process your data for other lawful purposes, such as legal obligations, contract
                            performance, or vital interests.
                        </li>
                    </ul>
                </div>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Privacy Notice Changes and Updates">
                <p>
                    We reserve the right to update or revise this privacy notice at any time. We will issue a new privacy notice whenever there are
                    significant changes. Previous versions of the privacy notice can be provided to data subjects upon request.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Feedback on Our Privacy Notice">
                <p>
                    You may contact our Data Privacy Officer through the contact details provided below for queries, clarifications, and complaints
                    regarding how we process your personal information.
                </p>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    <p className="font-semibold">For queries and concerns about this Policy, you may contact:</p>
                    <p className="mt-3 font-semibold">IRENE B. DUMLAO, MNSA, CESO IV</p>
                    <p>Data Protection Officer</p>
                    <a href="mailto:dpo@dswd.gov.ph" className="font-medium underline underline-offset-4">
                        dpo@dswd.gov.ph
                    </a>
                </div>
            </PrivacyNoticeSection>
        </div>
    );
}
