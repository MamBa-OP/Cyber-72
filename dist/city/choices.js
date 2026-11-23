/* Short, balanced responses for the ten neighbourhood conversations. */
(()=>{
  const choices=[
    [['Open the prize link to check which details it asks for.','পুরস্কারের লিংক খুলে কী তথ্য চাইছে দেখব।'],['Block the sender and report the message.','নম্বরটি ব্লক করে মেসেজ রিপোর্ট করব।'],['Forward the message and ask my friends if it looks real.','বন্ধুদের মেসেজ পাঠিয়ে জানতে চাইব এটি আসল কি না।']],
    [['Send ৳5,000 to the account he normally uses.','তার সাধারণ অ্যাকাউন্টেই ৫,০০০ টাকা পাঠাব।'],['Call his saved number and confirm the request.','সেভ করা নম্বরে ফোন করে নিশ্চিত হব।'],['Use the new payment number shown in the message.','মেসেজে দেওয়া নতুন নম্বরেই টাকা পাঠিয়ে দেব।']],
    [['Install it first; review the permissions afterward.','আগে অ্যাপ নামাব, পরে অনুমতিগুলো দেখব।'],['Verify the lender before using this app.','আগে ঋণদাতার পরিচয় যাচাই করব।'],['Give my bank PIN to confirm the loan.','লোন নিশ্চিত করতে ব্যাংকের পিন দেব।']],
    [['Share the codes with the caller.','ফোনের লোকটিকে কোডগুলো বলব।'],['Hang up; contact support through the official app.','ফোন কেটে অফিসিয়াল অ্যাপে সহায়তা নেব।'],['Tell him half the PIN now, then check his identity.','এখন অর্ধেক পিন বলব, তারপর তার পরিচয় যাচাই করব।']],
    [['Install the reward APK because the video has many likes.','ভিডিওতে অনেক লাইক আছে, তাই পুরস্কারের APK নামাব।'],["Use the game’s official offers.",'গেমের অফিসিয়াল অফার ব্যবহার করব।'],['Open the downloaded APK and allow the requested access.','নামানো APK খুলে চাওয়া সব অনুমতি দিয়ে দেব।']],
    [['Send a small booking deposit to reserve the phone.','ফোনটি রাখতে অল্প বুকিং মানি পাঠাব।'],['Verify the seller and use a protected way to buy.','বিক্রেতা যাচাই করে সুরক্ষিত পদ্ধতিতে কিনব।'],['Pay the full price to secure priority delivery.','আগে ডেলিভারি পেতে পুরো দাম পাঠিয়ে দেব।']],
    [['Pay the joining fee before the vacancy closes.','চাকরির সুযোগ শেষ হওয়ার আগে ফি দেব।'],['Refuse the fee; verify the employer independently.','ফি দেব না; নিয়োগদাতাকে আলাদাভাবে যাচাই করব।'],['Pay a bigger fee for the higher-paying task package.','বেশি আয়ের টাস্ক পেতে আরও বড় অঙ্কের ফি দেব।']],
    [['Pay in full since the product pictures look genuine.','পণ্যের ছবি আসল মনে হচ্ছে, তাই পুরো টাকা পাঠাব।'],['Check seller history, returns and buyer protection.','বিক্রেতার ইতিহাস, ফেরত নীতি ও ক্রেতার সুরক্ষা দেখব।'],['Send my NID photo as the shop requests.','দোকান বলেছে বলে এনআইডির ছবি দেব।']],
    [['Sign in here because the colours and logo look familiar.','রং ও লোগো চেনা মনে হচ্ছে, তাই এখানেই লগইন করব।'],['Close it and open the official app.','এটি বন্ধ করে অফিসিয়াল অ্যাপ খুলব।'],['Reset my password on this page.','এখানে পাসওয়ার্ড বদলাব।']],
    [['Pay ৳199 before the timer ends.','সময় শেষের আগেই ১৯৯ টাকা দেব।'],['Pause and independently check the seller and price.','থেমে বিক্রেতা ও আসল দাম আলাদাভাবে যাচাই করব।'],['Share the deal before it expires.','অফার শেষের আগে সবাইকে পাঠাব।']]
  ];
  choices.forEach((options,i)=>options.forEach((pair,j)=>C72Cases[i].options[j].text=pair));
})();
