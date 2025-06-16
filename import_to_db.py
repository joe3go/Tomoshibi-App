import psycopg2
import csv
# 🔒 Replace with your actual credentials
DB_CONFIG = {
    "dbname": "neondb",
    "user": "neondb_owner",
    "password": "npg_NIPTwh48qVnU",
    "host": "ep-damp-mud-a538kn2f.us-east-2.aws.neon.tech",
    "port": "5432"
}

CSV_PATH = "import_ready.csv"
TABLE_NAME = "jlpt_vocab"  # e.g., "vocabulary"


def import_selected_columns():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        with open(CSV_PATH, newline='', encoding="utf-8-sig") as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if not row or len(row) < 5:
                    continue  # Skip empty or incomplete rows

                kanji = row[0]  # CSV Column 1
                hiragana = row[1]  # CSV Column 2
                english_meaning = row[2]  # CSV Column 3
                jlpt_level = row[4]  # CSV Column 5

                cursor.execute(
                    f"""
                    INSERT INTO {TABLE_NAME} (kanji, hiragana, english_meaning, jlpt_level)
                    VALUES (%s, %s, %s, %s)
                """, (kanji, hiragana, english_meaning, jlpt_level))

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Import successful!")

    except Exception as e:
        print("❌ Error during import:", e)


if __name__ == "__main__":
    import_selected_columns()
