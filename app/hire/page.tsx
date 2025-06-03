import { BaseHomepage } from '@/components/homepage/base-homepage'
import { FadeIn } from '@/components/ui/fade-in'
import Script from 'next/script'

export default function RecruiterHomePage() {
  return (
    <>
      {/* Meta Pixel Code */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1028760061894244');
        fbq('track', 'PageView');`}
      </Script>
      <noscript dangerouslySetInnerHTML={{
        __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1028760061894244&ev=PageView&noscript=1" />`,
      }} />

      <div className="relative">
        <BaseHomepage
          userType="recruiter"
          headline="The Wrong Sales Hire Costs You More Than You Think"
          subheadline="Unlimited Sales Rep Placements plus expert support — training, proven scripts, process resources, CRM setup & optimisation, and KPI tracking through our custom software."
        />
      </div>
    </>
  )
} 