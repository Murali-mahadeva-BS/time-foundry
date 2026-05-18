import {
  Bug,
  Lightbulb,
  MessageSquare,
  Paperclip,
  Mail,
  Github,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/button";

const DEVELOPER_EMAIL = "muralimahadev40@gmail.com";
const GITHUB_URL = "https://github.com/Murali-mahadeva-BS/time-foundry";

interface FeedbackType {
  icon: React.ReactNode;
  label: string;
  subject: string;
  description: string;
  whatToInclude: string[];
  body: string;
}

const FEEDBACK_TYPES: FeedbackType[] = [
  {
    icon: <Bug className="h-5 w-5 text-destructive" />,
    label: "Bug Report",
    subject: "[Time Foundry] Bug Report: ",
    description:
      "Found something broken? Help fix it by describing exactly what happened.",
    whatToInclude: [
      "What you were doing when the bug occurred",
      "What you expected to happen",
      "What actually happened instead",
      "Screenshots or screen recordings of the issue",
      "Whether it happens every time or occasionally",
    ],
    body: `Hi,

I found a bug in Time Foundry.

What I was doing:
[Describe the steps that led to the bug]

What I expected:
[What should have happened]

What actually happened:
[What went wrong]

Does it happen every time? [Yes / No / Sometimes]

[Attach screenshots or recordings if helpful]

Thanks`,
  },
  {
    icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    label: "Feature Request",
    subject: "[Time Foundry] Feature Request: ",
    description:
      "Have an idea that would make Time Foundry better for your workflow?",
    whatToInclude: [
      "The problem or friction you currently experience",
      "What you wish the app could do",
      "How you imagine it would work",
      "Why it would be useful (your use case)",
    ],
    body: `Hi,

I have a feature idea for Time Foundry.

The problem I have today:
[Describe the pain point or missing capability]

What I'd like the app to do:
[Describe the feature]

How I imagine it working:
[Optional: describe the UI or flow]

Why this would help me:
[Your use case]

Thanks`,
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    label: "General Feedback",
    subject: "[Time Foundry] Feedback: ",
    description:
      "General thoughts, suggestions, or anything else on your mind.",
    whatToInclude: [
      "What you like or dislike about the current experience",
      "Anything that feels confusing or unintuitive",
      "Comparisons to other tools if helpful",
    ],
    body: `Hi,

Here's some feedback on Time Foundry:

[Your thoughts]

Thanks`,
  },
];

function openGmailCompose(type: FeedbackType) {
  const to = encodeURIComponent(DEVELOPER_EMAIL);
  const subject = encodeURIComponent(type.subject);
  const body = encodeURIComponent(type.body);
  window.open(
    `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`,
    "_blank",
  );
}

export function FeedbackPage() {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-8">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-semibold">Feedback / Contact</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Time Foundry is built by one developer. Your feedback directly
            shapes what gets fixed and built next.
          </p>
        </div>

        {/* Contact section */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Contact us</h2>
          <p className="text-sm text-muted-foreground">
            Reach out directly or follow the project on GitHub.
            <br />
            Emails go to{" "}
            <span className="font-mono text-foreground/80">
              {DEVELOPER_EMAIL}
            </span>
            . Every message is read.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                window.open(
                  `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(DEVELOPER_EMAIL)}`,
                  "_blank",
                )
              }
            >
              <Mail className="h-3.5 w-3.5" />
              Gmail: {DEVELOPER_EMAIL}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(GITHUB_URL, "_blank")}
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </Button>
          </div>
        </div>

        {/* Screenshot tip */}
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3">
          <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Attaching screenshots
            </span>{" "}
            — after Gmail opens, use the attachment button or drag and drop
            images into the compose window. A picture is worth a lot of
            debugging time.
          </p>
        </div>

        {/* Feedback cards */}
        <div className="space-y-4">
          {FEEDBACK_TYPES.map((type) => (
            <div
              key={type.label}
              className="rounded-xl border bg-card p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                {type.icon}
                <h2 className="font-semibold">{type.label}</h2>
              </div>

              <p className="text-sm text-muted-foreground">
                {type.description}
              </p>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  What to include
                </p>
                <ul className="space-y-1">
                  {type.whatToInclude.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openGmailCompose(type)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Gmail
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
