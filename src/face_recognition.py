import numpy as np
import cv2
import chromadb
from insightface.app import FaceAnalysis


class FaceAttendanceSystem:

    def __init__(
        self,
        model_name: str = "buffalo_l",
        det_size: tuple = (640, 640),
        ctx_id: int = -1,
        db_path: str = "./attendance_db",
        collection_name: str = "students",
    ):
        print("Initializing InsightFace...")
        self.app = FaceAnalysis(name=model_name)
        self.app.prepare(ctx_id=ctx_id, det_size=det_size)

        print("Connecting to ChromaDB...")
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        print("System ready.\n")

    # ------------------------------------------------------------------ #
    #  Private Helpers                                                     #
    # ------------------------------------------------------------------ #

    def _load_image(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {image_path}")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def _get_embedding(self, face) -> list:
        embedding = face.embedding
        embedding = embedding / np.linalg.norm(embedding)
        return embedding.tolist()

    def _detect_faces(self, image_path: str):
        img = self._load_image(image_path)
        return self.app.get(img), img

    # ------------------------------------------------------------------ #
    #  Registration                                                        #
    # ------------------------------------------------------------------ #

    def register_student(self, image_path: str, roll_number: str, name: str) -> bool:
        faces, _ = self._detect_faces(image_path)

        if len(faces) == 0:
            print(f"[WARN] No face detected for {name}")
            return False

        best_face = max(faces, key=lambda f: f.det_score)
        print(f"[INFO] Detected {len(faces)} face(s) — using best confidence: {best_face.det_score:.3f}")

        # upsert instead of add so re-registering the same roll number
        # updates the embedding rather than throwing a duplicate ID error.
        self.collection.upsert(
            embeddings=[self._get_embedding(best_face)],
            ids=[roll_number],
            metadatas=[{"name": name, "roll": roll_number}]
        )

        print(f"[OK] Registered {name} ({roll_number})")
        return True

    # ------------------------------------------------------------------ #
    #  Attendance                                                          #
    # ------------------------------------------------------------------ #

    def mark_attendance(self, group_photo_path: str, threshold: float = 0.45) -> list:
        faces, _ = self._detect_faces(group_photo_path)
        print(f"[INFO] Detected {len(faces)} faces in photo")

        attendance = []
        unrecognized = 0

        for face in faces:
            results = self.collection.query(
                query_embeddings=[self._get_embedding(face)],
                n_results=1
            )

            similarity = 1 - results["distances"][0][0]

            if similarity >= threshold:
                meta = results["metadatas"][0][0]
                attendance.append({
                    "roll": meta["roll"],
                    "name": meta["name"],
                    "similarity": round(similarity, 3)
                })
            else:
                unrecognized += 1

        print(f"\n[RESULT] Attendance Marked : {len(attendance)} students")
        print(f"[RESULT] Unrecognized faces: {unrecognized}")
        for record in attendance:
            print(f"  ✓ {record['name']} ({record['roll']}) — confidence: {record['similarity']}")

        return attendance

    # ------------------------------------------------------------------ #
    #  Visualization                                                       #
    # ------------------------------------------------------------------ #

    def visualize_detections(self, group_photo_path: str, output_path: str = "detections.jpg"):
        img_bgr = cv2.imread(group_photo_path)
        faces = self.app.get(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))

        for i, face in enumerate(faces):
            box = face.bbox.astype(int)
            conf = face.det_score

            cv2.rectangle(img_bgr, (box[0], box[1]), (box[2], box[3]), (0, 255, 0), 2)
            cv2.putText(img_bgr, f"#{i+1} {conf:.2f}", (box[0], box[1] - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        cv2.imwrite(output_path, img_bgr)
        print(f"[INFO] Saved detection image → {output_path} ({len(faces)} faces)")


if __name__ == "__main__":
    system = FaceAttendanceSystem()
    system.register_student("../photos/qazi.png", "B22CS087", "Qazi Talha Ali")
    system.register_student("../photos/pari.png", "B22CS039", "Pari sharma")
    system.register_student("../photos/chinmay.png", "B22BB001", "Chinmay Vashisth")
    system.register_student("../photos/vignesh.png", "B22CS099", "Vignesh something something")

    attendance = system.mark_attendance("../photos/group.png", 0.25)
    system.visualize_detections("../photos/group.png", "group_detections.jpg")