"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/hooks/use-auth";

type TabId =
  | "overview"
  | "dashboard"
  | "listings"
  | "showings"
  | "offers"
  | "team"
  | "settings"
  | "roles";

interface Tab {
  readonly id: TabId;
  readonly label: string;
  readonly brokerOnly?: boolean;
}

const tabs: readonly Tab[] = [
  { id: "overview", label: "Getting Started" },
  { id: "dashboard", label: "Dashboard" },
  { id: "listings", label: "Listings" },
  { id: "showings", label: "Showings" },
  { id: "offers", label: "Offers" },
  { id: "team", label: "Team", brokerOnly: true },
  { id: "settings", label: "Settings" },
  { id: "roles", label: "Roles & Permissions" },
];

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}

function Step({
  number,
  children,
}: {
  readonly number: number;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        {number}
      </span>
      <p className="text-sm leading-relaxed text-gray-600">{children}</p>
    </div>
  );
}

function Tip({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <span className="font-medium">Tip: </span>
      {children}
    </div>
  );
}

/* ---------- TAB CONTENT ---------- */

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Section title="What is ShowFlux?">
        <p>
          ShowFlux is a tool for real estate teams. It helps brokers and agents
          work together — managing property listings, scheduling showings for
          buyers, and tracking offers. Think of it as your team&apos;s shared
          notebook for everything related to selling properties.
        </p>
      </Section>

      <Section title="How does it work?">
        <p className="mb-3">Everything in ShowFlux follows a simple flow:</p>
        <div className="space-y-2">
          <Step number={1}>
            A broker or agent <strong>creates a listing</strong> — this is a
            property that&apos;s available for sale.
          </Step>
          <Step number={2}>
            Agents <strong>schedule showings</strong> — these are appointments
            where potential buyers visit the property.
          </Step>
          <Step number={3}>
            After a showing, an agent can <strong>submit an offer</strong> on
            behalf of a buyer who wants to purchase the property.
          </Step>
          <Step number={4}>
            The broker <strong>reviews and accepts</strong> (or rejects) the
            offer.
          </Step>
        </div>
      </Section>

      <Section title="Your workspace">
        <p>
          Your workspace is your team&apos;s private space. Everything you
          create — listings, showings, offers — belongs to your workspace. Other
          teams cannot see your data, and you cannot see theirs. It&apos;s like
          having your own separate office.
        </p>
      </Section>

      <Section title="Creating an account">
        <p className="mb-3">There are two ways to join ShowFlux:</p>
        <ul className="space-y-2">
          <li>
            <strong>Register yourself</strong> — Click &quot;Get Started&quot; on
            the home page, fill in your name, email, password, and a name for
            your workspace. You become the <strong>broker</strong> (the manager)
            of that workspace.
          </li>
          <li>
            <strong>Accept an invitation</strong> — If your broker already uses
            ShowFlux, they can send you an invitation link. Click the link, set
            your name and password, and you&apos;re in. You join as an{" "}
            <strong>agent</strong>.
          </li>
        </ul>
      </Section>

      <Section title="Forgot your password?">
        <p>
          On the login screen, click <strong>&quot;Forgot password?&quot;</strong>
          , enter your email, and we&apos;ll send you a link to create a new
          password. The link expires after a few hours, so use it right away.
        </p>
      </Section>

      <Tip>
        Use the <strong>Dashboard</strong> page to get a quick overview of
        what&apos;s happening in your workspace — how many active listings you
        have, recent activity, and more.
      </Tip>
    </div>
  );
}

function DashboardTab() {
  return (
    <div className="space-y-6">
      <Section title="What is the Dashboard?">
        <p>
          The Dashboard is your home screen. It shows you a snapshot of
          everything happening in your workspace right now — at a glance, without
          having to dig through individual pages.
        </p>
      </Section>

      <Section title="Summary cards">
        <p className="mb-2">
          At the top you&apos;ll see four cards with key numbers:
        </p>
        <ul className="space-y-2">
          <li>
            <strong>Listings</strong> — How many properties your team is managing
            and how many are currently active.
          </li>
          <li>
            <strong>Showings</strong> — Total showings and how many are scheduled
            (upcoming visits).
          </li>
          <li>
            <strong>Offers</strong> — Total offers and how many are waiting for a
            decision (submitted).
          </li>
          <li>
            <strong>Team</strong> — How many people are on your team.
          </li>
        </ul>
      </Section>

      <Section title="Quick actions">
        <p>
          Below the cards you&apos;ll find shortcut buttons —{" "}
          <strong>New Listing</strong>, <strong>Schedule Showing</strong>, and{" "}
          <strong>New Offer</strong>. These let you jump straight to creating
          something new without navigating through the sidebar.
        </p>
      </Section>

      <Section title="Activity feed">
        <p>
          The activity feed is like a timeline of everything that happened in
          your workspace. Every time someone creates a listing, schedules a
          showing, submits an offer, invites a team member, or changes a
          status — it appears here. You can see <em>who</em> did it,{" "}
          <em>what</em> they did, and <em>when</em>.
        </p>
      </Section>

      <Tip>
        The Dashboard updates automatically. If a colleague submits an offer
        while you&apos;re looking at the Dashboard, you&apos;ll see it in the
        activity feed the next time the page refreshes.
      </Tip>
    </div>
  );
}

function ListingsTab() {
  return (
    <div className="space-y-6">
      <Section title="What is a listing?">
        <p>
          A listing is a property that your team is selling. It contains all the
          important information about the property — the address, price, number
          of bedrooms, and so on.
        </p>
      </Section>

      <Section title="How to create a listing">
        <div className="space-y-2">
          <Step number={1}>
            Go to the <strong>Listings</strong> page from the sidebar.
          </Step>
          <Step number={2}>
            Click the <strong>&quot;New Listing&quot;</strong> button in the top
            right corner.
          </Step>
          <Step number={3}>
            Fill in the property details — address, city, state, ZIP, price,
            bedrooms, bathrooms, square footage, MLS number (optional), and a
            description.
          </Step>
          <Step number={4}>
            Click <strong>&quot;Create&quot;</strong> to save it. The listing
            will start in the &quot;Active&quot; status.
          </Step>
        </div>
      </Section>

      <Section title="Viewing and editing a listing">
        <p className="mb-2">
          Click on any listing in the table to open its <strong>detail page</strong>.
          There you can see all its information plus related showings and offers.
        </p>
        <p>
          To edit, click the <strong>&quot;Edit&quot;</strong> button on the
          detail page. Brokers can edit any listing; agents can only edit
          listings they created. When you&apos;re done, click{" "}
          <strong>&quot;Save&quot;</strong>.
        </p>
      </Section>

      <Section title="Deleting a listing">
        <p>
          Only brokers can delete a listing. On the detail page, click{" "}
          <strong>&quot;Delete&quot;</strong> and confirm. This removes the
          listing permanently, so make sure you really want to do this.
        </p>
      </Section>

      <Section title="Listing statuses">
        <ul className="space-y-2">
          <li>
            <strong>Active</strong> — The property is currently for sale. Agents
            can schedule showings and submit offers.
          </li>
          <li>
            <strong>Pending</strong> — An offer has been accepted, but the sale
            isn&apos;t final yet. No new offers can be submitted.
          </li>
          <li>
            <strong>Sold</strong> — The sale is complete. This listing is done.
          </li>
          <li>
            <strong>Withdrawn</strong> — The property has been taken off the
            market. No more showings or offers.
          </li>
        </ul>
      </Section>

      <Section title="Filtering and searching">
        <p>
          If you have many listings, use the filters at the top of the page. You
          can filter by <strong>status</strong> (e.g. show only active listings),
          by <strong>city</strong>, or by <strong>agent</strong>. This makes it
          easy to find exactly what you need. Pagination at the bottom lets you
          browse through large lists.
        </p>
      </Section>

      <Tip>
        You can only schedule showings and submit offers on listings that are in
        &quot;Active&quot; status. If a listing is pending, sold, or withdrawn,
        those actions are not available.
      </Tip>
    </div>
  );
}

function ShowingsTab() {
  return (
    <div className="space-y-6">
      <Section title="What is a showing?">
        <p>
          A showing is a scheduled visit to a property. When a potential buyer
          wants to see a property in person, an agent schedules a showing —
          basically an appointment with a date, time, and duration.
        </p>
      </Section>

      <Section title="How to schedule a showing">
        <div className="space-y-2">
          <Step number={1}>
            Go to the <strong>Showings</strong> page from the sidebar.
          </Step>
          <Step number={2}>
            Click <strong>&quot;Schedule Showing&quot;</strong>.
          </Step>
          <Step number={3}>
            Pick the listing (only active listings are available), set the date,
            time, duration (default is 30 minutes), and add any notes — like the
            buyer&apos;s name or special instructions.
          </Step>
          <Step number={4}>
            Click <strong>&quot;Create&quot;</strong> to save it. The showing
            starts in &quot;Scheduled&quot; status.
          </Step>
        </div>
      </Section>

      <Section title="Viewing and editing a showing">
        <p className="mb-2">
          Click on any showing in the table to see its details. From there you
          can edit the date, time, status, or add feedback.
        </p>
        <p>
          Brokers can edit any showing. Agents can only edit showings they
          created themselves.
        </p>
      </Section>

      <Section title="After the visit">
        <p>
          Once the showing happens, update its status to{" "}
          <strong>Completed</strong>. You can also add feedback — for example,
          &quot;Buyer loved the kitchen but wants a bigger yard.&quot; This helps
          the team keep track of buyer interest.
        </p>
      </Section>

      <Section title="Showing statuses">
        <ul className="space-y-2">
          <li>
            <strong>Scheduled</strong> — The visit is planned and hasn&apos;t
            happened yet.
          </li>
          <li>
            <strong>Completed</strong> — The visit happened successfully.
          </li>
          <li>
            <strong>Cancelled</strong> — The visit was called off before it
            happened.
          </li>
          <li>
            <strong>No Show</strong> — The buyer didn&apos;t show up for the
            visit.
          </li>
        </ul>
      </Section>

      <Section title="Filtering">
        <p>
          Use the filters at the top to view showings by{" "}
          <strong>status</strong> (e.g. only upcoming scheduled showings) or by{" "}
          <strong>listing</strong>. This is helpful when you want to see all
          visits for a particular property.
        </p>
      </Section>

      <Tip>
        After a showing is completed and the buyer is interested, the next step
        is to submit an offer. Go to the <strong>Offers</strong> page and click
        &quot;New Offer&quot;.
      </Tip>
    </div>
  );
}

function OffersTab() {
  return (
    <div className="space-y-6">
      <Section title="What is an offer?">
        <p>
          An offer is a formal proposal from a buyer to purchase a property. It
          includes the price the buyer is willing to pay, the buyer&apos;s name,
          and optionally an expiration date and notes.
        </p>
      </Section>

      <Section title="How to submit an offer">
        <div className="space-y-2">
          <Step number={1}>
            Go to the <strong>Offers</strong> page from the sidebar.
          </Step>
          <Step number={2}>
            Click <strong>&quot;New Offer&quot;</strong>.
          </Step>
          <Step number={3}>
            Select the listing (only active listings are available), enter the
            offer amount, the buyer&apos;s name, an expiration date if needed,
            and any notes.
          </Step>
          <Step number={4}>
            Click <strong>&quot;Submit&quot;</strong>. Your broker will be able to
            see it right away.
          </Step>
        </div>
      </Section>

      <Section title="What happens after you submit?">
        <p className="mb-2">
          Once an offer is submitted, the broker decides what to do with it:
        </p>
        <ul className="space-y-2">
          <li>
            <strong>Accept</strong> — The broker agrees to the offer. Only one
            offer per listing can be accepted. After acceptance, the listing
            status changes to &quot;Pending.&quot;
          </li>
          <li>
            <strong>Reject</strong> — The broker declines the offer. The buyer
            can submit a new one if they want.
          </li>
          <li>
            <strong>Counter</strong> — The broker suggests different terms (e.g.
            a higher price). The negotiation continues.
          </li>
        </ul>
      </Section>

      <Section title="Withdrawing an offer">
        <p>
          If the buyer changes their mind, the agent who submitted the offer can
          withdraw it. Just open the offer, change the status to{" "}
          <strong>&quot;Withdrawn&quot;</strong>, and save. Agents can only
          withdraw their own offers.
        </p>
      </Section>

      <Section title="Offer statuses">
        <ul className="space-y-2">
          <li>
            <strong>Submitted</strong> — The offer has been sent and is waiting
            for a decision.
          </li>
          <li>
            <strong>Accepted</strong> — The broker accepted this offer. Only one
            offer per listing can be accepted.
          </li>
          <li>
            <strong>Rejected</strong> — The broker decided not to accept this
            offer.
          </li>
          <li>
            <strong>Countered</strong> — The broker responded with different
            terms. The buyer can accept or negotiate further.
          </li>
          <li>
            <strong>Withdrawn</strong> — The buyer decided to take back their
            offer.
          </li>
          <li>
            <strong>Expired</strong> — The offer wasn&apos;t responded to before
            its expiration date.
          </li>
        </ul>
      </Section>

      <Section title="Filtering">
        <p>
          Use the filters to view offers by <strong>status</strong> (e.g. only
          submitted/pending offers), by <strong>listing</strong>, or by{" "}
          <strong>agent</strong>.
        </p>
      </Section>

      <Tip>
        Remember: only <strong>brokers</strong> can accept or reject offers.
        Agents can submit, edit, and withdraw their own offers.
      </Tip>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6">
      <Section title="What is the Team page?">
        <p>
          The Team page is where brokers manage who is part of their workspace.
          You can see all current members, invite new agents to join, and manage
          access.
        </p>
      </Section>

      <Section title="Inviting a new team member">
        <div className="space-y-2">
          <Step number={1}>
            Go to the <strong>Team</strong> page from the sidebar (broker only).
          </Step>
          <Step number={2}>
            In the <strong>&quot;Invitations&quot;</strong> section, enter the
            email of the person you want to invite.
          </Step>
          <Step number={3}>
            Click <strong>&quot;Send Invite&quot;</strong>. The system will
            generate an invitation link.
          </Step>
          <Step number={4}>
            Copy the link and share it with the new team member (via email,
            messenger, etc.).
          </Step>
          <Step number={5}>
            The person clicks the link, enters their name and password, and
            they&apos;re in — as an <strong>agent</strong> in your workspace.
          </Step>
        </div>
      </Section>

      <Section title="Invitation statuses">
        <ul className="space-y-2">
          <li>
            <strong>Pending</strong> — The invite has been sent but the person
            hasn&apos;t accepted yet.
          </li>
          <li>
            <strong>Accepted</strong> — The person created their account and
            joined your workspace.
          </li>
          <li>
            <strong>Expired</strong> — The link expired (after 7 days). You can
            send a new one.
          </li>
          <li>
            <strong>Revoked</strong> — You cancelled the invitation before it
            was used.
          </li>
        </ul>
      </Section>

      <Section title="Managing members">
        <p className="mb-2">
          In the <strong>&quot;Members&quot;</strong> section, you can see all
          people in your workspace.
        </p>
        <ul className="space-y-2">
          <li>
            <strong>Deactivate</strong> — If someone leaves or you need to
            temporarily restrict access, deactivate their account. They
            won&apos;t be able to log in, but all their data (listings, offers,
            etc.) is preserved.
          </li>
          <li>
            <strong>Reactivate</strong> — Changed your mind? Reactivate them
            and they can log in again. Nothing is lost.
          </li>
        </ul>
      </Section>

      <Section title="Revoking an invitation">
        <p>
          If you sent an invite by mistake or no longer want that person to join,
          click the revoke button next to the pending invitation. The link
          becomes invalid immediately.
        </p>
      </Section>

      <Tip>
        Only brokers can access the Team page. If you&apos;re an agent and need
        to invite someone, ask your broker to do it.
      </Tip>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <Section title="What can you change in Settings?">
        <p>
          The Settings page lets you update your personal information and, if
          you&apos;re a broker, your workspace name. Think of it as your account
          preferences.
        </p>
      </Section>

      <Section title="Profile">
        <p>
          Here you can update your <strong>full name</strong> and{" "}
          <strong>avatar URL</strong> (a link to your profile picture). Your
          email is shown but cannot be changed — it&apos;s your login identity.
        </p>
      </Section>

      <Section title="Change password">
        <p className="mb-2">To change your password:</p>
        <div className="space-y-2">
          <Step number={1}>
            Enter your <strong>current password</strong> (so we know it&apos;s
            really you).
          </Step>
          <Step number={2}>
            Enter your <strong>new password</strong>. It must be at least 8
            characters and include an uppercase letter, a lowercase letter, a
            number, and a special character.
          </Step>
          <Step number={3}>
            Confirm the new password and click <strong>&quot;Change Password&quot;</strong>.
          </Step>
        </div>
      </Section>

      <Section title="Workspace name (broker only)">
        <p>
          If you&apos;re a broker, you&apos;ll see a{" "}
          <strong>&quot;Workspace&quot;</strong> section where you can rename your
          workspace. This is the name your team sees. Agents don&apos;t have
          access to this setting.
        </p>
      </Section>

      <Tip>
        If you forgot your password and can&apos;t log in, use the{" "}
        <strong>&quot;Forgot password?&quot;</strong> link on the login screen to
        reset it via email.
      </Tip>
    </div>
  );
}

function RolesTab() {
  return (
    <div className="space-y-6">
      <Section title="Two roles: Broker and Agent">
        <p>
          ShowFlux has two types of users. Think of it like a small company —
          there&apos;s the manager (broker) and the team members (agents).
        </p>
      </Section>

      <Section title="Broker — the manager">
        <p className="mb-2">A broker can do everything:</p>
        <ul className="space-y-1.5">
          <li>Create, edit, and delete any listing in the workspace.</li>
          <li>Schedule and manage any showing.</li>
          <li>
            <strong>Accept or reject offers</strong> — this is a broker-only
            action.
          </li>
          <li>Invite new members and manage the team.</li>
          <li>Deactivate or reactivate team members.</li>
          <li>Change workspace settings (name, etc.).</li>
          <li>See everything that happens in the workspace.</li>
        </ul>
      </Section>

      <Section title="Agent — the team member">
        <p className="mb-2">An agent focuses on their own work:</p>
        <ul className="space-y-1.5">
          <li>Create new listings and showings.</li>
          <li>
            <strong>Edit only their own</strong> listings, showings, and offers —
            they cannot change another agent&apos;s work.
          </li>
          <li>Submit offers on active listings.</li>
          <li>Withdraw their own offers.</li>
          <li>
            View all listings, showings, and offers in the workspace (read
            access to everything).
          </li>
          <li>Cannot access the Team page, accept/reject offers, or delete anything.</li>
        </ul>
      </Section>

      <Section title="Quick comparison">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-medium text-gray-900">Action</th>
                <th className="py-2 px-4 font-medium text-gray-900">Broker</th>
                <th className="py-2 pl-4 font-medium text-gray-900">Agent</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Create listings / showings / offers</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">Yes</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Edit any record</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">Own only</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Delete records</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">No</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Accept / reject offers</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">No</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Manage team &amp; invites</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">No</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Change workspace name</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 pl-4">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Why does this matter?">
        <p>
          This setup keeps things organized and safe. Agents can do their
          day-to-day work without worrying about accidentally changing someone
          else&apos;s data. Brokers have full control to make important
          decisions like accepting offers and managing the team.
        </p>
      </Section>
    </div>
  );
}

/* ---------- TAB MAPPING ---------- */

const tabContent: Record<TabId, () => React.ReactNode> = {
  overview: OverviewTab,
  dashboard: DashboardTab,
  listings: ListingsTab,
  showings: ShowingsTab,
  offers: OffersTab,
  team: TeamTab,
  settings: SettingsTab,
  roles: RolesTab,
};

export default function HowToPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { user } = useAuth();
  const isBroker = user?.role === "broker";

  const visibleTabs = tabs.filter((tab) => !tab.brokerOnly || isBroker);
  const ActiveContent = tabContent[activeTab];

  return (
    <div className="space-y-6">
      <PageHeader
        title="How To"
        description="A simple guide to help you get the most out of ShowFlux"
      />

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="py-6">
          <ActiveContent />
        </CardContent>
      </Card>
    </div>
  );
}
