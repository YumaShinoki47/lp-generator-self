import os
import google.generativeai as genai
import json
import re
import ray
from collections import defaultdict
from PIL import Image
from io import BytesIO
import time
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

######################################
## AIモデル選択
######################################

## geminiを使う場合
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 128000,
    "response_mime_type": "text/plain",
}

## claudeを使う場合
import anthropic
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)
def claude(system_prompt, prompt):
    message = client.messages.create(
        # model = "claude-3-5-sonnet-20241022",
        model = "claude-3-7-sonnet-20250219",
        max_tokens = 8192,
        temperature = 1,
        system = system_prompt,
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    # print(message.content[0].text)
    return message.content[0].text


######################################
## 補助関数
######################################

def safe_json_loads(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n", "", text)
        text = re.sub(r"\n```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError as e:
                raise Exception("抽出した JSON のデコードに失敗しました") from e
        else:
            raise Exception("テキスト内に有効な JSON が見つかりませんでした")

## Markdown のコードブロック（```html）からHTMLコード部分を抽出する
def extract_html_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:html)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return None

## Markdown のコードブロック（```css）からCSSコード部分を抽出する
def extract_css_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:css)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return text

## Markdown のコードブロック（```js）からjsコード部分を抽出する
def extract_js_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:javascript)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return text

## テキストデータ内のHTMLコードとCSSコードを区別する
def extract_code_blocks_by_type(text):
    pattern = r'```(\w+)\n(.*?)\n```'
    matches = re.finditer(pattern, text, re.DOTALL)
    
    code_dict = defaultdict(list)
    for match in matches:
        lang, code = match.groups()
        code_dict[lang].append(code.strip())

    html_code = "\n".join(code_dict.get("html", []))
    css_code = "\n".join(code_dict.get("css", []))

    return html_code, css_code

## ファイルに書き込む
def save_to_file(html_content, file_name):
    try:
        with open(file_name, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"{file_name}にコンテンツを保存しました。")
    except Exception as e:
        print(html_content)
        print(f"エラーが発生しました: {e}")

## APIを使って画像生成するコード
@ray.remote
def generate_image_by_imagen3(prompt, file_name, aspect_ratio=None):
    from PIL import Image, ImageDraw, ImageFont
    import base64
    
    # ファイル名に基づいてアスペクト比を決定
    if aspect_ratio is None:
        if 'html' in file_name.lower():
            aspect_ratio = '16:9'
        elif 'css' in file_name.lower():
            aspect_ratio = '16:9'
        else:
            aspect_ratio = '1:1'  # デフォルト値

    try:
        if aspect_ratio == '16:9':
            img_size = (640, 360)
        elif aspect_ratio == '1:1':
            img_size = (400, 400)
        else:
            img_size = (640, 480)
            
        img = Image.new('RGB', img_size, color='lightblue')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.load_default()
        except:
            font = None
            
        text_lines = [
            "Generated Image",
            f"Prompt: {prompt[:30]}...",
            f"Size: {img_size[0]}x{img_size[1]}",
            f"Aspect: {aspect_ratio}"
        ]
        
        y_offset = 20
        for line in text_lines:
            if font:
                draw.text((20, y_offset), line, fill='black', font=font)
            else:
                draw.text((20, y_offset), line, fill='black')
            y_offset += 25
        
        img.save(file_name)
        print(f"プレースホルダー画像を保存しました: {file_name}")
        return file_name
        
    except Exception as e:
        print(f"画像生成エラー: {e}")
        return None


######################################
## エージェント関数
######################################

## ワイヤーフレーム作成エージェント
def wireframe_generate_agent(section_idea):
    print("\n===ワイヤーフレーム作成エージェント===")
    print("【ClaudeでHTMLを作成しています．．．】")
    
#     system_prompt = (
# """あなたは、ランディングページ（LP）のワイヤーフレーム作成に特化したエージェントです。

# **タスク:**

# 与えられたLPの構成案を基に、HTMLでワイヤーフレームを作成してください。

# **入力:**

# LPの構成案が与えられます。

# **出力:**

# *   完全なhtmlコードのみを出力としてください。
# *   CSSやJavaScriptによるデザインコードはここでは含めず、後に追加することを想定してください。
# *   ヘッダーとフッターは、必ず含めてください。
# *   画像を適度に使用して、デザインを向上させてください。（images.unsplash.comでフリー画像を使用しても構いません。）ただし、ヒーローセクションだけは画像を入れてはいけません。
# *   '<body>'タグの最下部に、以下のコードを含めてください。これにより、アイコンが使えるようになるので、適切に使用してください。
#     <script>
#             lucide.createIcons();
#     </script>
# *   '<head>タグ内部には、<link rel="stylesheet" href="style.css">を含めてください。
# *   `<body>`タグの最下部には、<script src="script.js"></script>を含めてください。
# """
#     )
    system_prompt = (
"""あなたは、ランディングページ（LP）のワイヤーフレーム作成に特化したエージェントです。

**タスク:**

与えられたLPの構成案を基に、HTMLでワイヤーフレームを作成してください。

**入力:**

LPの構成案が与えられます。

**出力:**

*   完全なhtmlコードのみを出力としてください。
*   CSSやJavaScriptによるデザインコードはここでは含めず、後に追加することを想定してください。
*   ヘッダーとフッターは、必ず含めてください。
*   画像を適度に使用して、デザインを向上させてください。（画像ファイル名はプレースホルダーにしてください。画像のアスペクト比は、'横16:縦9'想定です。形式は、必ず次のようにしてください。形式："placeholder_html_(番号).png"）ただし、ヒーローセクションだけは画像を入れてはいけません。
*   '<body>'タグの最下部に、以下のコードを含めてください。これにより、アイコンが使えるようになるので、適切に使用してください。
    <script>
            lucide.createIcons();
    </script>
*   '<head>タグ内部には、<link rel="stylesheet" href="style.css">を含めてください。
*   `<body>`タグの最下部には、<script src="script.js"></script>を含めてください。
"""
    )
    response = claude(system_prompt, str(section_idea))
    data = extract_html_code(response)

    ## htmlファイルとして保存
    save_to_file(data, "index.html")

    return data

## デザイン提案エージェント（CSS）
def design_css_agent(html_data):
    print("\n===デザイン提案エージェント（CSS）===")

    print("【ClaudeでCSSを作成しています．．．】")
    system_prompt = (
"""あなたは、HTMLで構築されたランディングページ（LP）にCSSでデザインを提案するエージェントです。

**タスク:**

与えられたHTMLに対して、魅力的なLPとなるようにCSSコードでデザインを提案してください。

**入力:**

*   セクション構成が既に構築されたHTMLが与えられます。

**出力:**

*   厳密なCSSコードのみを出力してください。余分な説明文を含めないでください。
*   デザイン性を重視してください。
*   ヒーローセクションには、背景画像を適用してください。（画像ファイル名はプレースホルダーにしてください。形式："placeholder_css_(番号).png"）画像上のテキストの可読性に注意して、テキストに影を加えたり、画像上に暗いオーバーレイを入れたりと、工夫してください。
"""    
    )
    response = claude(system_prompt, html_data)
    data = extract_css_code(response)

    ## cssファイルとして保存
    save_to_file(data, "style.css")

    return data

## デザイン提案エージェント（JS）
def design_js_agent(html_data, css_data):
    print("\n===デザイン提案エージェント（JS）===")
    print("【ClaudeでJSを作成しています．．．】")
    system_prompt = (
"""あなたは、HTMLで構築されたランディングページ（LP）にJavaScriptを用いて動的なデザイン要素を追加するエージェントです。

**タスク:**

与えられたHTMLに対して、ユーザーエクスペリエンスを向上させるためのJavaScriptコードを提案してください。

**入力:**

*   セクション構成が既に構築されたHTMLコードと、CSSコードが与えられます。

**出力:**

*   厳密なJavaScriptコードのみを出力してください。
*   デザイン性を重視して、ユーザーエクスペリエンスの向上を目指してください。"""

    )
    prompt = (
        "**HTML**:"
        f"{html_data}"
        ""
        "**CSS**:"
        f"{css_data}"
    )
    response = claude(system_prompt, prompt)
    data = extract_js_code(response)

    ## cssファイルとして保存
    save_to_file(data, "script.js")

    return data

## 画像を作成するエージェント
def image_generate_agent(html_data, css_data):
    print("\n===画像を作成するエージェント===")
    
    ## まずは必要な画像の情報を取得する
    model = genai.GenerativeModel(
        model_name = "gemini-2.0-flash",
        generation_config = generation_config,
        system_instruction = (
            "あなたは、画像生成のプロンプトを作成するエージェントです。"
            "あなたには、ランディングページのHTMLコード及びCSSコードが与えられます。"

            "**出力**:"
            "HTMLコード及びCSSコードの中から、画像のプレースホルダーを検索してください。"
            "また、各画像に対して、その画像を生成AIで生成するためのプロンプトを英語で考えてください。文字の入るような画像は避けてください。（プロンプト内で、「子供」を連想させるフレーズは使わないでください。）"
            "出力形式は、厳密なJSON形式で、キーをプレースホルダー名、バリューをプロンプトにしてください。"
        )
    )
    
    response = model.generate_content(str(f"""
```html
{html_data}
```
```css
{css_data}
```
    """))
    image_information_json = safe_json_loads(response.text)
    print(image_information_json)

    ## プレースホルダーのファイル名とプロンプトをそれぞれリストにまとめる
    file_name_data = list(image_information_json.keys())
    prompt_data = list(image_information_json.values())
    print(f"生成する画像ファイル: {file_name_data}")
    print(f"使用するプロンプト: {prompt_data}")

    generated_files = []
    ## リストの順番で画像生成
    try:
        if not ray.is_initialized():
            ray.init()
        
        image_tasks = [
            generate_image_by_imagen3.remote(image_prompt, file_name)
            for image_prompt, file_name in zip(prompt_data, file_name_data)
        ]
        
        generated_files = ray.get(image_tasks)
        print(f"生成された画像ファイル: {generated_files}")
        time.sleep(0.5)

    except Exception as e:
        print(f"画像生成タスクの作成中にエラーが発生しました: {e}")
    
    return generated_files

## 画像を適用するエージェント
def apply_image(html_data, css_data):
    print("\n===画像を適用するエージェント===")
    print("【Geminiでコードを修正中です．．．】")

    # model = genai.GenerativeModel(
    #     model_name = "gemini-2.0-flash",
    #     generation_config = generation_config,
    #     system_instruction = (
    #         "あなたは、HTMLとCSSに画像を適用するエージェントです。"
    #         "あなたには、htmlコードとcssコードが与えられます。"

    #         "**出力**:"
    #         """*   画像は'background-image: url(${imageBase64})'の形式で挿入されることを想定し、htmlコードとcssコードを修正してください。"""
    #         "*   出力は、入力のコードを修正したhtmlコード全文、cssコード全文としてください。"
    #         "*   CSSでは、background-imageのURLを'${imageBase64}'というプレースホルダーで指定してください。これは後でJavaScriptによって実際の画像データに置き換えられます。"

    #         "**注意点**:"
    #         "*   変更はヒーローセクションに限定してください。他のセクションには手を加えないでください。"
    #         "*   画像上のテキストの可読性に注意して、テキストに影を加えたり、画像上に暗いオーバーレイを入れたりと、工夫してください。"
    #         "*   画像のアスペクト比は16:9の想定です。コンテナーサイズは画像の高さに合わせて変更してください（800pxほど）。"
    #     )
    # )
    model = genai.GenerativeModel(
        model_name = "gemini-2.0-flash",
        generation_config = generation_config,
        system_instruction = (
            "あなたは、HTMLとCSSに画像を適用するエージェントです。"
            "あなたには、htmlコードとcssコードが与えられます。"

            "**出力**:"
            "*   画像は'background-image: url('placeholder_css_[番号].jpg')'の形式で挿入されることを想定し、cssコードを修正してください。"
            "*   1セクションに対し、1つの画像を背景として適用してください。"
            "*   画像ファイルの[番号]は、セクションの順番に対応するようにしてください。"
            "*   出力は、入力のコードを修正したcssコード全文としてください。"

            "**注意点**:"
            "*   画像上のテキストの可読性に注意して、テキストに影を加えたり、画像上に暗いオーバーレイを入れたりと、工夫してください。"
            "*   画像のアスペクト比は16:9の想定です。コンテナーサイズは画像の高さに合わせて変更してください（800pxほど）。"
        )
    )
    prompt = (
        "**HTML**:"
        f"{html_data}"
        
        "**CSS**:"
        f"{css_data}"
    )
    response = model.generate_content(prompt)
    # save_to_file(response.text, "result.txt")

    ## responseをhtmlコードとcssコードに分割
    html_code = extract_code_blocks_by_type(response.text)[0]
    css_code = extract_code_blocks_by_type(response.text)[1]

    ## ファイル保存
    # save_to_file(html_code, "index.html")
    
    # 画像パスを修正: placeholder_css_*.jpg -> placeholder_html_*.png
    # 実際に生成されたファイルに合わせて修正
    import glob
    import re
    
    # 生成されたPNGファイルのリストを取得
    png_files = glob.glob("placeholder_*.png")
    print(f"生成されたPNGファイル: {png_files}")
    
    # CSSの中のJPG参照をPNG参照に置換
    updated_css = css_code
    
    # 一番最初のPNGファイルをフォールバック用画像として使用
    if png_files:
        fallback_image = png_files[0]
        print(f"フォールバック画像として使用: {fallback_image}")
        
        # placeholder_css_*.jpg の参照を存在するPNGファイルに置換
        jpg_pattern = r"placeholder_css_\d+\.jpg"
        updated_css = re.sub(jpg_pattern, fallback_image, updated_css)
        
        # 一般的なJPG参照もPNGに置換
        jpg_pattern2 = r"placeholder_.*\.jpg"
        updated_css = re.sub(jpg_pattern2, fallback_image, updated_css)
        
        print("CSS内の画像参照を修正しました")
    
    save_to_file(updated_css, "style.css")

    return html_code, updated_css


######################################
## メイン
######################################

def main(section_idea):
    ## ワイヤーフレーム作成エージェントに接続
    html_data = wireframe_generate_agent(section_idea)

    ## デザインエージェントに接続（CSS）
    css_data = design_css_agent(html_data)

    ## デザインエージェントに接続（JS）
    # design_js_agent(html_data, css_data)

    ## 画像生成エージェントに接続
    generated_images = image_generate_agent(html_data, css_data)
    print(f"生成された画像: {generated_images}")

    ## 画像適用エージェントに接続
    # apply_image(html_data, css_data)

    ## rayを使用している場合は終了
    if ray.is_initialized():
        ray.shutdown()

    print("\n【完了しました！　動作を終了します。】")


if __name__ == "__main__":
    ## ユーザーの入力例
    section_idea = """サービス名：EasySpeak

サービス概要：オンライン英会話スクール

LP構成
① ヒーローセクション
② 特徴セクション
③ 強みセクション
④ こんな人にオススメセクション
⑤ プラン・料金セクション
6 お問い合わせセクション

提供：株式会社アブソリュート"""

    main(section_idea)
