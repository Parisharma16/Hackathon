from face_recognition import FaceAttendanceSystem


class AttendanceOrchestrator:

    def __init__(self, **kwargs):
        self.system = FaceAttendanceSystem(**kwargs)

    def register(self, image_path: str, roll: str, name: str) -> bool:
        return self.system.register_student(image_path, roll, name)

    def mark(self, group_photo_path: str, threshold: float = 0.45) -> list:
        return self.system.mark_attendance(group_photo_path, threshold)

    def visualize(self, group_photo_path: str, output_path: str = "detections.jpg"):
        self.system.visualize_detections(group_photo_path, output_path)

    def run_pipeline(self, group_photo_path: str) -> list:
        attendance = self.mark(group_photo_path)
        print("\nFinal Attendance List:")
        for person in attendance:
            print(f"  {person['name']} ({person['roll']})")
        return attendance