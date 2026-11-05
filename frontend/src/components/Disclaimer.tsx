export default function Disclaimer() {
  return (
    <details className="disclaimer">
      <summary>⚠️ PRIVACY &amp; SECURITY DISCLAIMER - click to read</summary>
      <div className="body">
        <ul>
          <li>
            <b>Local use:</b> When you run HealthyPockets on your own computer, your CSV goes from
            your browser to a small Python server running on that same computer. It is processed
            in memory only, never written to disk, and not sent to any other service. Closing the
            app clears it.
          </li>
          <li>
            <b>Public hosting:</b> If this app is ever hosted on a public website, what you type
            or upload would pass through that host&apos;s server and may appear in its logs.{" "}
            <b>
              Do not enter real bank data into a hosted copy unless you trust the host and its
              owner.
            </b>{" "}
            Use the sample data instead.
          </li>
          <li>
            <b>No login:</b> Anyone who can open the page can use it, so only run it on a computer
            and network you trust.
          </li>
          <li>
            <b>Not financial advice:</b> Categories are guessed from keywords and may be wrong.
            Check your numbers against your bank statements.
          </li>
          <li>
            <b>Safest option:</b> Download the code from GitHub and run it yourself so your data
            never leaves your computer.
          </li>
        </ul>
      </div>
    </details>
  );
}
