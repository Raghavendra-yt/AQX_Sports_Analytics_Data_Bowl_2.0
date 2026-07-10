import sqlite3
conn = sqlite3.connect("apexos_cache.db")
cursor = conn.cursor()
cursor.execute("SELECT DISTINCT circuits.circuitId, circuits.name, circuits.location FROM circuits JOIN races ON circuits.circuitId = races.circuitId")
for row in cursor.fetchall():
    print(f"ID: {row[0]} | Name: {row[1]} | Location: {row[2]}")
conn.close()
