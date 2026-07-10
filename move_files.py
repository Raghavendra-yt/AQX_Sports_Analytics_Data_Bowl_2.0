import os
import shutil

csv_files = [
    "circuits.csv",
    "constructor_results.csv",
    "constructor_standings.csv",
    "constructors.csv",
    "driver_standings.csv",
    "drivers.csv",
    "lap_times.csv",
    "pit_stops.csv",
    "qualifying.csv",
    "races.csv",
    "results.csv",
    "seasons.csv",
    "sprint_results.csv",
    "status.csv"
]

os.makedirs("data", exist_ok=True)
for file in csv_files:
    if os.path.exists(file):
        dest = os.path.join("data", file)
        print(f"Moving {file} to {dest}...")
        try:
            shutil.move(file, dest)
        except Exception as e:
            print(f"Error moving {file}: {e}")
print("Done!")
