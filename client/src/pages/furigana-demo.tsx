import FuriganaText from "@/components/enhanced-furigana";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FuriganaDemo() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          Furigana Toggle Feature Demo
        </h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Japanese Text with Furigana</CardTitle>
              <CardDescription>
                Click the toggle button to show/hide furigana (ruby text)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuriganaText 
                text="私(わたし)の名前(なまえ)は田中(たなか)です。日本(にほん)から来(き)ました。"
                className="mb-6"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complex Text Example</CardTitle>
              <CardDescription>
                More complex sentence with multiple kanji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuriganaText 
                text="今日(きょう)は美(うつく)しい桜(さくら)の花(はな)を見(み)に公園(こうえん)へ行(い)きました。天気(てんき)が良(よ)くて、とても気持(きも)ちが良(よ)かったです。"
                className="mb-6"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mixed Text (Japanese and English)</CardTitle>
              <CardDescription>
                Text with both furigana and regular text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuriganaText 
                text="Hello! 私(わたし)は学生(がくせい)です。English and 日本語(にほんご)を勉強(べんきょう)しています。"
                className="mb-6"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Text Without Toggle Button</CardTitle>
              <CardDescription>
                This component doesn't show the toggle button
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuriganaText 
                text="東京(とうきょう)は大(おお)きい都市(とし)です。"
                showToggleButton={false}
                className="mb-6"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Uses proper HTML <code>&lt;ruby&gt;</code> and <code>&lt;rt&gt;</code> tags</li>
                <li>Toggle button controls visibility of all furigana on the page</li>
                <li>User preference is saved to localStorage</li>
                <li>CSS classes control the display state</li>
                <li>Works with multiple ruby elements simultaneously</li>
                <li>Responsive and accessible design</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}